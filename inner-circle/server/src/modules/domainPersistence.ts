/**
 * MongoDB persistence for the domain store.
 *
 * The domain store (forum, chat, check-ins, appointments, saved resources,
 * professionals, flags, audit) is kept in memory so route handlers can stay
 * synchronous. On serverless platforms many instances run at once, so memory
 * alone is not durable: an instance can write a record and another instance
 * will not see it.
 *
 * To fix that we persist every collection to a single generic MongoDB
 * collection keyed by (collection, recordKey):
 *
 *   - `hydrateDomainStore()` loads the whole store into memory at the start of
 *     a request.
 *   - `persistDomainDiff(baseline)` compares the current memory against the
 *     snapshot taken right after hydration and upserts only the records that
 *     changed (and deletes the ones that disappeared). This means concurrent
 *     instances never clobber each other's untouched records.
 *
 * When MongoDB is not connected both functions are no-ops, so local development
 * and the hermetic test suite keep running purely in memory.
 */
import mongoose from 'mongoose'
import { domainCollections, exportDomainState, importDomainState, type DomainState } from './store'

const recordSchema = new mongoose.Schema(
  {
    coll: { type: String, required: true },
    rid: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: 'domain_records', versionKey: false, minimize: false },
)
recordSchema.index({ coll: 1, rid: 1 }, { unique: true })

type DomainRecordModel = mongoose.Model<{ coll: string; rid: string; data?: unknown }>

const DomainRecord: DomainRecordModel =
  (mongoose.models.DomainRecord as DomainRecordModel | undefined) ??
  (mongoose.model('DomainRecord', recordSchema) as unknown as DomainRecordModel)

export const isDomainStoreReady = (): boolean => mongoose.connection.readyState === 1

const serialize = (record: Record<string, unknown>): string => JSON.stringify(record)

/** Load the persisted domain store into the in-memory collections. */
export const hydrateDomainStore = async (): Promise<void> => {
  if (!isDomainStoreReady()) return
  const names = domainCollections.map(collection => collection.name)
  const documents = await DomainRecord.find({ coll: { $in: names } }).lean()
  const state: DomainState = {}
  for (const collection of domainCollections) state[collection.name] = []
  for (const document of documents as Array<{ coll: string; data: unknown }>) {
    if (!state[document.coll]) state[document.coll] = []
    state[document.coll].push(document.data as Record<string, unknown>)
  }
  importDomainState(state)
}

/**
 * Persist the difference between the live in-memory store and the baseline
 * captured immediately after hydration. Only changed/added/removed records are
 * written, so unrelated records changed by other instances are preserved.
 */
export const persistDomainDiff = async (baseline: DomainState): Promise<void> => {
  if (!isDomainStoreReady()) return
  const operations: Array<Promise<unknown>> = []

  for (const collection of domainCollections) {
    const before = new Map<string, string>()
    for (const record of baseline[collection.name] ?? []) before.set(collection.key(record), serialize(record))

    const seen = new Set<string>()
    for (const record of collection.get()) {
      const key = collection.key(record)
      seen.add(key)
      if (before.get(key) !== serialize(record)) {
        operations.push(
          DomainRecord.updateOne({ coll: collection.name, rid: key }, { $set: { data: record } }, { upsert: true }),
        )
      }
    }

    for (const key of before.keys()) {
      if (!seen.has(key)) operations.push(DomainRecord.deleteOne({ coll: collection.name, rid: key }))
    }
  }

  if (operations.length > 0) await Promise.all(operations)
}

/** Convenience helper primarily for tests/diagnostics. */
export const currentDomainState = (): DomainState => exportDomainState()

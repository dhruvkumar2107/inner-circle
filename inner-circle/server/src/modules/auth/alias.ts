import { randomInt } from 'node:crypto'

const adjectives = `Harmonious Serene Gentle Radiant Steady Hopeful Luminous Tranquil Resilient Mellow Kind Courageous Calm Gracious Patient Bright Tender Grounded Joyful Thoughtful Warm Welcoming Peaceful Mindful Balanced Brave Compassionate Curious Diligent Dreaming Eager Empathetic Flourishing Forgiving Friendly Grateful Growing Healing Honest Imaginative Inspired Intuitive Jubilant Lively Loving Lucid Nurturing Openhearted Optimistic Patient Persevering Positive Present Quiet Renewed Restful Reverent Safe Sincere Soulful Spirited Still Sunny Supportive Sweet Thankful Trusting Understanding Uplifted Vibrant Vivacious Wholehearted Wise Wondrous Youthful Zestful Adventurous Affectionate Altruistic Amiable Appreciative Assured Attentive Authentic Benevolent Blissful Breezy Capable Caring Centered Cheerful Clearhearted Comforting Confident Considerate Content Creative Daring Delightful Dependable Determined Devoted Earnest Easygoing Encouraging Enduring Enthusiastic Excited Faithful Fearless Flexible Focused Freehearted Generous Glowing Goodhearted Graceful Heartening Helpful Humble Illuminated Joyous Just Jubilant Knowing Lighthearted Lucent Lush Magnanimous Modest Neighborly Noble Observant Peaceable Perceptive Placid Playful Poised Prudent Reassuring Reflective Refreshed Reliable Resourced Reverent Sensible Serendipitous Sharing Shining Skillful Smiling Sociable Steadfast Sunnyhearted Tranquil Upbeat Valuable Virtuous Welcoming Wholesome Willing`.split(/\s+/)

const nouns = `Aurora Meadow Lantern Horizon Willow Ember Breeze Harbor Comet Lotus River Sunrise Starling Ocean Pebble Sunrise Summit Valley Blossom Brook Cedar Cloud Coral Cosmos Dawn Fern Finch Forest Galaxy Garden Glimmer Grove Harbor Haven Heather Indigo Island Juniper Kite Lagoon Lark Laurel Leaf Light Magnolia Maple Marigold Moon Morning Mountain Nectar Nova Olive Orchid Orchard Otter Pebble Petal Phoenix Pine Poppy Prairie Prism Rain Rainbow Reef Robin Rose Rowan Sailor Sequoia Shore Sky Song Sparrow Spring Summit Sunbeam Teal Thistle Tide Timber Topaz Trail Tree Tulip Universe Vale Violet Wave Wren Yarrow Zephyr Acorn Almond Amber Apple Aspen Bayberry Bellbird Bluebell Book Briar Candle Canyon Cattail Celestia Clover Coast Constellation Creek Crystal Cypress Daisy Delta Driftwood Echo Elm Evergreen Fable Feather Field Firefly Fuchsia Garnet Glade Goldfinch Goldleaf Graceland Harborlight Hazel Hyacinth Iris Ivory Jade Jasmine Jewel Joy Juniperberry Kindling Kingfisher Koi Lake Lavender Lemon Lilac Linden Lodestar Lullaby Mariner Moonbeam Moss Nightingale Northstar Opal Paloma Paperplane Parasol Pear Periwinkle Phoenix Pinecone Planet Plum Quill Quietude Raindrop Redwood Ribbon Ripple Rosewood Saffron Sandalwood Seabird Seashell Shimmer Silverleaf Snowdrop Solstice Songbird Sparkle Star Starfruit Stone Story Summer Sunflower Sweetpea Symphony Tangerine Teacup Thimble Trillium Twilight Umbrella Universe Verbena Vista Walnut Waterlily Wildflower Wind Willowbark Wisteria Woodland`.split(/\s+/)

export const ALIAS_ADJECTIVES: readonly string[] = Object.freeze([...new Set(adjectives)])
export const ALIAS_NOUNS: readonly string[] = Object.freeze([...new Set(nouns)])

export const generateAlias = (): string => {
  const adjective = ALIAS_ADJECTIVES[randomInt(ALIAS_ADJECTIVES.length)]
  const noun = ALIAS_NOUNS[randomInt(ALIAS_NOUNS.length)]
  return `${adjective} ${noun}`
}

export const generateUniqueAlias = async (
  isTaken: (alias: string) => Promise<boolean>,
): Promise<string> => {
  const combinations = ALIAS_ADJECTIVES.length * ALIAS_NOUNS.length
  for (let attempt = 0; attempt < combinations; attempt += 1) {
    const alias = generateAlias()
    if (!(await isTaken(alias))) return alias
  }

  const base = generateAlias()
  for (let suffix = 2; suffix < 100_000; suffix += 1) {
    const candidate = `${base} ${suffix}`
    if (!(await isTaken(candidate))) return candidate
  }
  throw new Error('Could not allocate a unique anonymous alias')
}

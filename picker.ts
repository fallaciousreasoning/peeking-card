import { Article } from "./model";

const topNewsChannel = 'Top News'
const entertainmentChannel = 'Entertainment'

export interface Options {
    maxCandidates: number
}

const defaultOptions: Options = {
    maxCandidates: 10
}

const random = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]

export const pickPeekingCard = (publishers: string[], channels: string[], articles: Article[], options = defaultOptions): Article => {
    const publishersSet = new Set(publishers)
    const channelsSet = new Set(channels)

    const candidates: [Article, number][] = []

    for (const article of articles) {
        let score = 0

        if (publishersSet.has(article.publisher_id)) {
            score += 10
        }
        if (article.channels.some(c => channelsSet.has(c))) {
            score += 8
        }

        const publishTime = new Date(article.publish_time).getTime()
        const elapsed = Date.now() - publishTime
        if (elapsed < 3600 * 1000) {
            score += 5
        } else if (elapsed < 864000 * 1000) {
            score += 3
        }

        if (score > 0) {
            candidates.push([article, score])
        }
    }

    const hour = new Date().getHours()
    for (const article of candidates) {
        // Boost news in the morning
        if (6 <= hour && hour <= 10 && article[0].channels.includes(topNewsChannel)) {
            article[1] += 3
        }

        // Boost entertainment in the evening
        if (17 <= hour && hour <= 22 && article[0].channels.includes(entertainmentChannel)) {
            article[1] += 3
        }
    }

    const sorted = candidates.sort(([, aScore], [, bScore]) => {
        return bScore - aScore
    })

    const finalCandidates: Article[] = []
    const seenChannels = new Set<string>()

    // Pick a number of candidates
    for (const [article] of sorted) {
        if (finalCandidates.length >= defaultOptions.maxCandidates) break
        if (article.channels.some(c => seenChannels.has(c))) continue

        finalCandidates.push(article)
        for (const channel of article.channels) seenChannels.add(channel)
    }

    // Select a random candidate
    if (finalCandidates.length) return random(finalCandidates)


    return articles[0]
}

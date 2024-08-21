import { Article } from "./model";

const topNewsChannel = 'Top News'
const entertainmentChannel = 'Entertainment'

const round = (n: number, dps = 2) => {
    const exp = Math.pow(10, dps)
    return Math.round(n * exp) / exp
}

export class Trace {
    #score = 0

    get score() {
        return this.#score
    }

    changes: { change: number, type: 'add' | 'mul' | 'msg', reason: string }[] = []

    constructor(reason?: string) {
        if (reason) {
            this.changes.push({
                type: 'msg', change: 0, reason
            })
        }
    }

    mul(by: number, reason: string) {
        this.#score *= by
        this.changes.push({
            change: by,
            type: 'mul',
            reason
        })
    }

    add(amount: number, reason: string) {
        this.#score += amount
        this.changes.push({
            change: amount,
            type: 'add',
            reason
        })
    }

    explain() {
        const explain = ({ change, reason, type }) => type === 'msg'
            ? `${reason}`
            : `${type} ${round(change)} because ${reason}`
        return this.changes.map(explain).join('\n')
    }
}

export interface Options {
    maxCandidates: number
}

const defaultOptions: Options = {
    maxCandidates: 10
}

export interface PeekingCardResult {
    finalCandidates: [Article, Trace][],
    result: [Article, Trace]
}

const random = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)]

export const pickPeekingCard = (publishers: string[], channels: string[], articles: Article[], options = defaultOptions): PeekingCardResult => {
    const publishersSet = new Set(publishers)
    const channelsSet = new Set(channels)

    const candidates: [Article, Trace][] = []

    for (const article of articles) {
        const trace = new Trace

        if (publishersSet.has(article.publisher_id)) {
            trace.add(10, `publisher is subscribed (${article.publisher_name})`)
        }
        if (article.channels.some(c => channelsSet.has(c))) {
            trace.add(5, `a channel is subscribed (${article.channels.filter(c => channelsSet.has(c)).join(', ')})`)
        }

        // Past here, we just multiply, so if we aren't subscribed we can skip
        if (trace.score === 0) continue

        const publishTime = new Date(article.publish_time).getTime()
        const elapsed = Date.now() - publishTime
        if (elapsed < 3600 * 1000) {
            trace.mul(1.3, `article is less than 1 hour old (${round(elapsed / 1000)} seconds)`)
        } else if (elapsed < 864000 * 1000) {
            trace.mul(1.1, `articles is less than 1 day old (${round(elapsed / 3600 / 1000)} hours)`)
        }

        candidates.push([article, trace])
    }

    const hour = new Date().getHours()
    for (const [article, trace] of candidates) {
        // Boost news in the morning
        if (6 <= hour && hour <= 10 && article[0].channels.includes(topNewsChannel)) {
            trace.add(3, `its the morning and this article is in the ${topNewsChannel} channel`)
        }

        // Boost entertainment in the evening
        if (17 <= hour && hour <= 22 && article[0].channels.includes(entertainmentChannel)) {
            trace.add(3, `its the evening and this article is in the ${entertainmentChannel} channel`)
        }
    }

    const sorted = candidates.sort(([, aTrace], [, bTrace]) => {
        return bTrace.score - aTrace.score
    })

    const finalCandidates: [Article, Trace][] = []
    const seenChannels = new Map<string, number>()
    const followingCount = publishersSet.size + channelsSet.size

    // Make sure we can pick enough options to have at least |maxCandidates|
    // options in out finalCandidates.
    const channelLimit = followingCount < options.maxCandidates
        ? (options.maxCandidates / followingCount)
        : 1

    // Pick a number of candidates
    for (const [article, trace] of sorted) {
        if (finalCandidates.length >= defaultOptions.maxCandidates) break
        if (article.channels.some(c => (seenChannels.get(c) ?? 0) >= channelLimit)) continue

        finalCandidates.push([article, trace])
        for (const channel of article.channels) {
            seenChannels.set(channel, (seenChannels.get(channel) ?? 0) + 1)
        }
    }

    // Select a random candidate, fall back to the first article
    const pick = random(finalCandidates) ?? [articles[0], new Trace('no scored articles')]
    return {
        finalCandidates,
        result: pick
    }
}

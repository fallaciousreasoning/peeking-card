import { Article, Publisher } from "./model"
import { pickPeekingCard, Trace } from "./picker"

const HARDCODE_LOCALE = "en_US"

const getChannelsFromPublishers = (publishers: Publisher[]) => {
    return Array.from(new Set(publishers.flatMap(p => p.locales.filter(l => l.locale === HARDCODE_LOCALE).flatMap(l => l.channels))))
}
const getPublishers = () => fetch('https://brave-today-cdn.brave.com/sources.global.json').then(r => r.json()).then(r => r.filter(r => r.locales.find(l => l.locale === HARDCODE_LOCALE))) as Promise<Publisher[]>
const getArticles = () => fetch(`https://brave-today-cdn.brave.com/brave-today/feed.${HARDCODE_LOCALE}.json`).then(r => r.json()) as Promise<Article[]>

const publishersPromise = getPublishers()
const articlesPromise = getArticles()

const publishersEl = document.getElementById('publishers')!
const channelsEl = document.getElementById('channels')!
const updatePublishersList = async () => {
    const publishers = await publishersPromise
    const channels = getChannelsFromPublishers(publishers)

    const template = document.getElementById('publisherOrChannel') as HTMLTemplateElement

    const makeLabel = (id: string, name: string, parent: HTMLElement) => {
        const el = template.content.cloneNode(true) as HTMLElement
        const check = el.querySelector('input') as HTMLInputElement
        check.setAttribute('data-id', id)
        check.addEventListener('change', () => updatePeekingCard())

        el.querySelector('label')?.setAttribute('data-name', name)
        el.querySelector('.name')!.textContent = name
        el
        parent.append(el)
    }
    for (const publisher of publishers) {
        makeLabel(publisher.publisher_id, publisher.publisher_name, publishersEl)
    }

    for (const channel of channels) {
        makeLabel(channel, channel, channelsEl)
    }
}

updatePublishersList()

const filter = document.getElementById('filter') as HTMLInputElement
filter.addEventListener('input', e => {
    const query = (e.target as any).value.toLowerCase() as string
    const elements = document.querySelectorAll('#publishers label, #channels label')
    for (const element of Array.from(elements)) {
        const name = element.getAttribute('data-name')?.toLowerCase() ?? ''
        if (name.includes(query)) {
            element.removeAttribute('hidden')
        }
        else {
            element.setAttribute('hidden', '')
        }
    }
})

const selectedPublisherIds = () => {
    return Array.from(document.querySelectorAll('#publishers input:checked')).map(r => r.getAttribute('data-id')!)
}

const selectedChannelIds = () => {
    return Array.from(document.querySelectorAll('#channels input:checked')).map(r => r.getAttribute('data-id')!)
}

const createArticleCard = ([article, trace]: [Article, Trace]) => {
    const template = document.getElementById('peekingCard') as HTMLTemplateElement
    const el = template.content.cloneNode(true) as HTMLDivElement

    const title = el.querySelector('.title') as HTMLAnchorElement
    title.textContent = article.title
    title.setAttribute('href', article.url)

    const publisher = el.querySelector('.publisher') as HTMLSpanElement
    publisher.textContent = article.publisher_name

    const publishTime = el.querySelector('.publishTime') as HTMLSpanElement
    publishTime.textContent = article.publish_time

    const scoreEl = el.querySelector('.score') as HTMLSpanElement
    scoreEl.textContent = trace.score.toString()

    const traceEl = el.querySelector('.trace') as HTMLUListElement
    traceEl.innerHTML = trace.explain().split('\n').map(t => `<li>${t}</li>`).join('')
    return el
}

const updatePeekingCard = async () => {
    await publishersPromise
    const articles = await articlesPromise
    const {
        result,
        finalCandidates
    } = pickPeekingCard(selectedPublisherIds(), selectedChannelIds(), articles)

    const peekingCard = createArticleCard(result)
    const peekingResult = document.getElementById('peekingResult') as HTMLDivElement
    peekingResult.replaceChildren(peekingCard)

    const finalCandidatesEl = document.getElementById('finalCandidates') as HTMLDivElement
    finalCandidatesEl.replaceChildren(...finalCandidates.map(c => {
        const el = createArticleCard(c)
        if (c[0] === result[0]) el.querySelector('.card')!.classList.add('selected')
        return el
    }))
}

updatePeekingCard()
document.getElementById('refresh')?.addEventListener('click', updatePeekingCard)

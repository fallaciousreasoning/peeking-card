interface Publisher {
    publisher_name: string
    publisher_id: string
    locales: { locale: string, channels: string[] }[]
}

const HARDCODE_LOCALE = "en_US"

const getChannelsFromPublishers = (publishers: Publisher[]) => {
    return Array.from(new Set(publishers.flatMap(p => p.locales.filter(l => l.locale === HARDCODE_LOCALE).flatMap(l => l.channels))))
}
const getPublishers = () => fetch('https://brave-today-cdn.brave.com/sources.global.json').then(r => r.json()).then(r => r.filter(r => r.locales.find(l => l.locale === HARDCODE_LOCALE))) as Promise<Publisher[]>

const publishersPromise = getPublishers()

const publishersEl = document.getElementById('publishers')!
const channelsEl = document.getElementById('channels')!
const updatePublishersList = async () => {
    
    const publishers = await publishersPromise
    const channels = getChannelsFromPublishers(publishers)
    
    const template = document.getElementById('publisherOrChannel') as HTMLTemplateElement
    
    for (const publisher of publishers) {
        const el = template.content.cloneNode(true) as HTMLElement
        el.querySelector('input')?.setAttribute('data-id', publisher.publisher_id)
        el.querySelector('label')?.setAttribute('data-name', publisher.publisher_name)
        el.querySelector('.name')!.textContent = publisher.publisher_name
        publishersEl.append(el)
    }
    
    for (const channel of channels) {
        const el = template.content.cloneNode(true) as HTMLElement
        el.querySelector('input')?.setAttribute('data-id', channel)
        el.querySelector('label')?.setAttribute('data-name', channel)
        el.querySelector('.name')!.textContent = channel
        channelsEl.append(el)
    }
}

updatePublishersList()

const filter = document.getElementById('filter') as HTMLInputElement
filter.addEventListener('input', e => {
    const query = (e.target as any).value.toLowerCase() as string
    const elements = document.querySelectorAll('#publishers label, #channels label')
    for (const element of Array.from(elements)) {
        const name =element.getAttribute('data-name')?.toLowerCase() ?? ''
        if (name.includes(query)) {
            element.removeAttribute('hidden')
        }
         else {
            element.setAttribute('hidden', '')
         }
    }
})

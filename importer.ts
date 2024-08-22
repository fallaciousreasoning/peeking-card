const loadInput = document.getElementById('load') as HTMLInputElement

const parsers = {
    publishers: (lines: string[]) => {
        const publishers = Array.from(document.querySelectorAll('#publishers input[type=checkbox]'))
        for (const publisher of publishers) {
            (publisher as HTMLInputElement).checked = false
        }

        for (const line of lines) {
            const input = document.querySelector(`#publishers [data-id="${line.split(',')[0].trim()}"]`) as HTMLInputElement
            if (!input) continue;
            input.checked = true
        }
    },
    locale: (lines: string[]) => {
        if (lines.length !== 1) throw new Error('too many lines for locale!')
    },
    channels: (lines: string[]) => {
        const channels = Array.from(document.querySelectorAll('#channels input[type=checkbox]'))
        for (const channel of channels) {
            (channel as HTMLInputElement).checked = false
        }

        for (const line of lines) {
            const input = document.querySelector(`#channels [data-id="${line.trim()}"]`) as HTMLInputElement
            if (!input) continue;
            input.checked = true
        }
    },
    'suggested publishers': () => {},
    history: () => {}
}

const parse = (text: string) => {
    const parts = text.split('# ').filter(t => t)
    for (const part of parts) {
        const lines = part.split('\n').filter(t => t)
        const parser = lines[0]

        if (parsers[parser]) {
            parsers[parser](lines.slice(1))
        } else {
            console.log("dunno what to do with", parser)
        }
    }
}

export const importBraveNewsData = async (e) => {
    const file = loadInput.files?.[0];
    if (!file) return

    const { promise, resolve } = Promise.withResolvers<ProgressEvent<FileReader>>()
    const reader = new FileReader()
    reader.onload = resolve

    reader.readAsText(file, 'utf-8')
    const result = await promise
    const text = reader.result as string

    console.log(text)
    parse(text);
    (document.querySelector('#refresh') as HTMLButtonElement).click()
}

loadInput.addEventListener('change', importBraveNewsData)

export interface Publisher {
    publisher_name: string
    publisher_id: string
    locales: { locale: string, channels: string[] }[]
}

export interface Article {
    title: string
    publish_time: string
    description: string
    url: string
    publisher_id: string
    publisher_name: string
    channels: string[]
    img: string
}

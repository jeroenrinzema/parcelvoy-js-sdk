type ClientProps = {
    apiKey: string
    urlEndpoint: string
}

type TrackProps = {
    event: string
    anonymousId?: string
    externalId?: string
    traits: Record<string, any>
}

type IdentifyProps = {
    anonymousId?: string
    externalId: string
    phone: string
    email: string
    traits: Record<string, any>
}

type AliasProps = {
    anonymousId: string
    externalId: string
}

export class Client {
    #apiKey: string
    #urlEndpoint: string

    constructor(props: ClientProps) {
        this.#apiKey = props.apiKey
        this.#urlEndpoint = props.urlEndpoint
    }

    async track(props: TrackProps) {
        return await this.#request('track', props)
    }

    async identify(props: IdentifyProps) {
        return await this.#request('identify', props)
    }

    async alias(props: AliasProps) {
        return await this.#request('identify', props)
    }

    async #request(path: string, data: Record<string, any>) {
        const request = await fetch(`${this.#urlEndpoint}/client/${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.#apiKey}`,
            },
            body: JSON.stringify(data),
        })
        return await request.json()
    }
}

export class BrowserClient extends Client {

    #anonymousId: string = this.uuid()
    #externalId?: string
    #client: Client

    constructor(props: ClientProps) {
        super(props)
        this.#client = new Client(props)
    }

    async track(props: TrackProps) {
        return await this.#client.track({
            ...props,
            anonymousId: this.#anonymousId,
            externalId: this.#externalId
        })
    }

    async identify(props: IdentifyProps) {
        this.#externalId = props.externalId
        return await this.#client.identify({
            ...props,
            anonymousId: this.#anonymousId,
            externalId: this.#externalId
        })
    }

    async alias(props: AliasProps) {
        this.#externalId = props.externalId
        return await this.#client.alias(props)
    }

    uuid() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        )
    }
}

export class Parcelvoy {
    static instance?: BrowserClient = undefined

    static initialize(props: ClientProps) {
        Parcelvoy.instance = new BrowserClient(props)
    }

    static async track(props: TrackProps) {
        return await Parcelvoy.instance?.track(props)
    }

    static async identify(props: IdentifyProps) {
        return await Parcelvoy.instance?.identify(props)
    }

    static async alias(props: AliasProps) {
        return await Parcelvoy.instance?.alias(props)
    }
}


// If running in a browser, expose Parcelvoy from the window object
declare global {
    interface Window { Parcelvoy: any; }
}

if (typeof window !== 'undefined') {
    window.Parcelvoy = Parcelvoy
}

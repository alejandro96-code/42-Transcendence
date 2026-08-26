import { Profanity } from '@2toad/profanity'

const profanity = new Profanity({
    languages: ['en', 'es'],
    wholeWord: true,
})

export function containsProfanity(text) {
    if (typeof text !== 'string' || !text.trim()) {
        return false
    }

    return profanity.exists(text)
}

export function censorProfanity(text) {
    if (typeof text !== 'string') {
        return text
    }

    return profanity.censor(text)
}
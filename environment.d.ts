declare global {
    namespace NodeJS {
        interface ProcessEnv {
            githubtoken: string
        }
    }
}

export {}
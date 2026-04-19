// source/index.ts

interface Greeting {
    message: string;
    timestamp: Date;
}

async function greet(name: string): Promise<Greeting> {
    return {
        message: `Hello, ${name}!`,
        timestamp: new Date(),
    };
}

(async () => {
    const result = await greet("World");
    console.log(result.message);
    console.log("Time:", result.timestamp.toISOString());
})();

// source/index.ts
async function greet(name) {
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
//# sourceMappingURL=index.js.map
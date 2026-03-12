export function debounce<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | undefined;

    return (...args: Parameters<T>): void => {
        if (timer !== undefined) {
            clearTimeout(timer);
        }

        timer = setTimeout(() => {
            fn(...args);
            timer = undefined;
        }, delay);
    };
}

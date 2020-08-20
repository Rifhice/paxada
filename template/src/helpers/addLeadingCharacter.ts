export default (num: string | number, size: number, character = '0'): string => {
    let s = String(num);
    while (s.length < size) s = character + s;
    return s;
};

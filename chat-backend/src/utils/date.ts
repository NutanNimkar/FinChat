export const getCurrentQuarter= (): {year: number, quarter: number}=> {
    const date = new Date();
    let year = date.getFullYear();
    const month = date.getMonth() + 1;
    let quarter = Math.floor((month - 1) / 3) + 1;
    return {year, quarter};
}

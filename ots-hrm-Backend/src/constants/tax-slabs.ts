export const PAKISTAN_TAX_SLABS = [
    {
        minAmount: 0,
        maxAmount: 600000,
        rate: 0,
        fixedAmount: 0,
        description: "Up to Rs 600,000: 0%"
    },
    {
        minAmount: 600001,
        maxAmount: 1200000,
        rate: 1,
        fixedAmount: 0,
        description: "Rs 600,001–1,200,000: 1% on amount exceeding"
    },
    {
        minAmount: 1200001,
        maxAmount: 2200000,
        rate: 11,
        fixedAmount: 6000,
        description: "Rs 1,200,001–2,200,000: Rs 6,000 + 11% of excess"
    },
    {
        minAmount: 2200001,
        maxAmount: 3200000,
        rate: 23,
        fixedAmount: 116000,
        description: "Rs 2,200,001–3,200,000: Rs 116,000 + 23% of excess"
    },
    {
        minAmount: 3200001,
        maxAmount: 4100000,
        rate: 30,
        fixedAmount: 346000,
        description: "Rs 3,200,001–4,100,000: Rs 346,000 + 30% of excess"
    },
    {
        minAmount: 4100001,
        maxAmount: undefined,
        rate: 35,
        fixedAmount: 616000,
        description: "Above Rs 4,100,000: Rs 616,000 + 35% of excess"
    }
]; 
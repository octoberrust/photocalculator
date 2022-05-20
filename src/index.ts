export type ServiceYear = 2020 | 2021 | 2022;
export type ServiceType = "Photography" | "VideoRecording" | "BlurayPackage" | "TwoDayEvent" | "WeddingSession";
export type ServicePrices = { [key in ServiceType]: number }
export type ServicePackage = {
    incudes: ServiceType[],
    priceReduction: number
};

export interface PriceList {
    year: ServiceYear;
    prices: ServicePrices;
}

const priceCatalog: PriceList[] = [
    {
        year: 2020,
        prices: {
            Photography: 1700,
            VideoRecording: 1700,
            BlurayPackage: 300,
            TwoDayEvent: 400,
            WeddingSession: 600
        },

    },
    {
        year: 2021,
        prices: {
            Photography: 1800,
            VideoRecording: 1800,
            BlurayPackage: 300,
            TwoDayEvent: 400,
            WeddingSession: 600
        },
    },
    {
        year: 2022,
        prices: {
            Photography: 1900,
            VideoRecording: 1900,
            BlurayPackage: 300,
            TwoDayEvent: 400,
            WeddingSession: 600
        }
    }
]

export class Discount {
    constructor(
        public name: string,
        public includedServices: ServiceType[],
        public forYear: number,
        public discountValue: number
    ) {
    }

    canApply(selectedServices: ServiceType[], selectedYear: ServiceYear): boolean {
        return selectedYear === this.forYear
            && this.includedServices.every(v => selectedServices.includes(v));
    }
}

export class DiscountCalculator {
    private discounts: Discount[] = [
        new Discount('PhotographyVideoRecording', ["Photography", "VideoRecording"], 2020, 1200),
        new Discount('PhotographyVideoRecording', ["Photography", "VideoRecording"], 2021, 1300),
        new Discount('PhotographyVideoRecording', ["Photography", "VideoRecording"], 2022, 1300),
        new Discount('WeddingAndPhotography', ["Photography", "WeddingSession"], 2020, 300),
        new Discount('WeddingAndPhotography', ["Photography", "WeddingSession"], 2021, 300),
        new Discount('WeddingAndPhotography', ["Photography", "WeddingSession"], 2022, 600),
        new Discount('WeddingVideo', ["VideoRecording", "WeddingSession"], 2020, 300),
        new Discount('WeddingVideo', ["VideoRecording", "WeddingSession"], 2021, 300),
        new Discount('WeddingVideo', ["VideoRecording", "WeddingSession"], 2022, 300),
        new Discount('VideoPhotoWedding', ["VideoRecording", "Photography", "WeddingSession"], 2020, 1500),
        new Discount('VideoPhotoWedding', ["VideoRecording", "Photography", "WeddingSession"], 2021, 1600),
        new Discount('VideoPhotoWedding', ["VideoRecording", "Photography", "WeddingSession"], 2022, 1900),
    ];

    constructor(public selectedServices: ServiceType[], public selectedYear: ServiceYear) {
    }

    calculate(price: number) {
        const discounts = this.selectDiscounts().map(v => v.discountValue);
        if (discounts.length === 0) {
            return price;
        }
        const unique = new Set(discounts);
        const bestDiscount = Array.from(unique).sort((a,b)=>b-a)[0];
        return (price - bestDiscount)
    }
    private selectDiscounts(): Discount[] {
        const inYear = this.discounts.filter(y => y.forYear === this.selectedYear)
        return inYear.filter(d => d.canApply(this.selectedServices, this.selectedYear));
    }
}

export const indexRemoveAdditionalService = (srv: ServiceType[], toRemove: ServiceType) => {
    const containsPhotoRelatedServices = srv.includes("TwoDayEvent");
    const containsVideo = srv.includes("VideoRecording");
    if (toRemove === "Photography" && containsPhotoRelatedServices && !containsVideo) {
        return srv.indexOf("TwoDayEvent");
    }
    return -1;
}
export const canSelect = (services: ServiceType[], selectedService: ServiceType) =>
    !services.includes("VideoRecording") && selectedService === "BlurayPackage";
export const updateSelectedServices = (
    previouslySelectedServices: ServiceType[],
    action: { type: "Select" | "Deselect"; service: ServiceType }
) => {

    switch (action.type) {
        case "Select":
            if (canSelect(previouslySelectedServices, action.service)) {
                return [...previouslySelectedServices];
            }
            const set = new Set(previouslySelectedServices);
            set.add(action.service);
            return Array.from(set);
        case "Deselect":
            let result = [...previouslySelectedServices];
            const additionalIndex = indexRemoveAdditionalService(result, action.service);
            if (additionalIndex > -1) {
                result.splice(additionalIndex, 1)
            }
            const index = result.indexOf(action.service);
            if (index > -1) {
                result.splice(index, 1)
            }
            return [...result];
        default:
            return [...previouslySelectedServices];
    }
};

export const serviceGuard = (services: ServiceType[]) => {
    if (services.includes("BlurayPackage") && !services.includes("VideoRecording")) {
        return updateSelectedServices(services, {type: "Deselect", service: "BlurayPackage"})
    }

    return [...services]
}
export const calculatePrice = (selectedServices: ServiceType[], selectedYear: ServiceYear) => {
    if (selectedServices.length === 0) {
       return ({basePrice:0, finalPrice:0}); 
    }
    const calculator = new DiscountCalculator(selectedServices, selectedYear);
    const pricesInYear = priceCatalog.find(p => p.year === selectedYear);
    let bp = 0;
    let fp = 0;
    const servicesToCalculate = serviceGuard(selectedServices);

    servicesToCalculate.forEach(srv => {
            bp = bp + pricesInYear.prices[srv];
        }
    );
    fp = calculator.calculate(bp);
    return ({basePrice: bp, finalPrice: fp});
}
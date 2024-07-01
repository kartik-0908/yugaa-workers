import axios from "axios";
import { updateProductwithID } from "./common/pubsubPublisher";

function extractProductData(products: any) {
    return products.map((product: any) => {
        const {id} = product;
        return [id];
    });
}
export async function fetchProducts(shop: string, accessToken: string) {
    let pageInfo = null;
    const limit = 250;
    do {
        const response: any = await axios.get(
            `https://${shop}/admin/api/2024-04/products.json`,
            {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                },
                params: {
                    limit,
                    page_info: pageInfo,
                },
            }
        );
        const { products } = response.data
        console.log(products);
        const extractedData = extractProductData(products);
        for (const [id] of extractedData) {
           await updateProductwithID(shop, id,"new");
        }
        const linkHeader = response.headers.link;
        if (linkHeader) {
            const nextLink = linkHeader.split(',').find((link: any) => link.includes('rel="next"'));
            if (nextLink) {
                const nextUrl = nextLink.split(';')[0].trim().slice(1, -1);
                const nextPageInfo = new URL(nextUrl).searchParams.get('page_info');
                pageInfo = nextPageInfo;
            } else {
                pageInfo = null;
            }
        } else {
            pageInfo = null;
        }
    } while (pageInfo);
    console.log("product fetching finished")
} 
import axios from "axios";
import pc from "./lib/pinecone";
import { PineconeIndexcreate, createEmbedding, extractIndexName } from "./common/function";
import redis from "./lib/redis";

// function extractProductData(products: any) {
//     const productsData = products.map((product: any) => {
//         const {
//             id,
//             title,
//             body_html,
//             product_type,
//             tags,
//             variants,
//             options,
//             image,
//         } = product;

//         const productString = `Title: ${title}
//           Body HTML: ${body_html || ''}
//           Product Type: ${product_type}
//           Tags: ${tags}
//           Variants: ${variants
//                 .map(
//                     (variant: any) =>
//                         `ID: ${variant.id}, Title: ${variant.title}, Price: ${variant.price}, SKU: ${variant.sku}, Inventory Quantity: ${variant.inventory_quantity}`
//                 )
//                 .join('; ')}
//           Options: ${options
//                 .map((option: any) => `ID: ${option.id}, Name: ${option.name}, Values: ${option.values.join(', ')}`)
//                 .join('; ')}
//           Image: ${image
//                 ? `ID: ${image.id}, Source: ${image.src}, Alt Text: ${image.alt}, Width: ${image.width}, Height: ${image.height}`
//                 : 'No Image'
//             }`;

//         return [id, productString];
//     });

//     return productsData;
// }
function extractProductData(products: any) {
    return products.map((product: any) => {
        const {id} = product;
        return [id];
    });
}

export async function fetchProducts(shop: string, accessToken: string) {
    let pageInfo = null;
    const limit = 250;
    const indexName = extractIndexName(shop);
    await PineconeIndexcreate(indexName)
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
            await redis.lpush('product-update', JSON.stringify({
                id: id,
                shopDomain: shop,
                type: "new"
            }))
            // const embedding = await createEmbedding(details);
            // Insert embedding into Pinecone
            const index = pc.index(indexName);
            // await index.upsert(
            //     [
            //         {
            //             id: String(id),
            //             values: embedding,
            //             metadata: { text: details }
            //         },
            //     ]);
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
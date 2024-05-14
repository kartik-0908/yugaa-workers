"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchProducts = void 0;
const axios_1 = __importDefault(require("axios"));
const pinecone_1 = __importDefault(require("./lib/pinecone"));
const function_1 = require("./common/function");
const redis_1 = __importDefault(require("./lib/redis"));
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
function extractProductData(products) {
    return products.map((product) => {
        const { id } = product;
        return [id];
    });
}
function fetchProducts(shop, accessToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let pageInfo = null;
        const limit = 250;
        const indexName = (0, function_1.extractIndexName)(shop);
        yield (0, function_1.PineconeIndexcreate)(indexName);
        do {
            const response = yield axios_1.default.get(`https://${shop}/admin/api/2024-04/products.json`, {
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                },
                params: {
                    limit,
                    page_info: pageInfo,
                },
            });
            const { products } = response.data;
            console.log(products);
            const extractedData = extractProductData(products);
            for (const [id] of extractedData) {
                yield redis_1.default.lpush('product-update', JSON.stringify({
                    id: id,
                    shopDomain: shop,
                    type: "new"
                }));
                // const embedding = await createEmbedding(details);
                // Insert embedding into Pinecone
                const index = pinecone_1.default.index(indexName);
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
                const nextLink = linkHeader.split(',').find((link) => link.includes('rel="next"'));
                if (nextLink) {
                    const nextUrl = nextLink.split(';')[0].trim().slice(1, -1);
                    const nextPageInfo = new URL(nextUrl).searchParams.get('page_info');
                    pageInfo = nextPageInfo;
                }
                else {
                    pageInfo = null;
                }
            }
            else {
                pageInfo = null;
            }
        } while (pageInfo);
        console.log("product fetching finished");
    });
}
exports.fetchProducts = fetchProducts;

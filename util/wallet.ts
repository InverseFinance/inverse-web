import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { createThirdwebClient } from "thirdweb";
 
export const thirdwebClient = createThirdwebClient({
  clientId: "81cf69fe9cc66a36a319da14666b2bc7",
});
 
// const provider = ethers5Adapter.provider.toEthers({
//   client,
//   chainId,
// });
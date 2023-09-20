import { Box, BoxProps, Image } from '@chakra-ui/react'

import { isAddress, parseUnits } from 'ethers/lib/utils';
import { useEnsProfile } from '@app/hooks/useEnsProfile';
import makeBlockie from 'ethereum-blockies-base64';
import { Contract } from 'ethers';
import { AlchemyProvider } from '@ethersproject/providers';
import { NetworkIds } from '@app/types';
import { useCustomSWR } from '@app/hooks/useCustomSWR';
import localforage from 'localforage'
import { useMemo } from 'react';

const erc721Abi = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 _tokenId) external view returns (string)',
];

const erc1155Abi = [
  'function balanceOf(address _owner, uint256 _id) view returns (uint256)',
  'function uri(uint256 _id) view returns (string)',
];

export const getGatewayUrl = (uri: string, tokenId?: string): string => {
  const match = new RegExp(/([a-z]+)(?::\/\/|\/)(.*)/).exec(uri);

  if (!match || match.length < 3) {
    return uri;
  }

  const id = match[2];
  let url = uri;

  switch (match[1]) {
    case 'ar': {
      url = `https://arweave.net/${id}`;
      break;
    }
    case 'ipfs':
      if (id.includes('ipfs') || id.includes('ipns')) {
        url = `https://gateway.ipfs.io/${id}`;
      } else {
        url = `https://gateway.ipfs.io/ipfs/${id}`;
      }
      break;
    case 'ipns':
      if (id.includes('ipfs') || id.includes('ipns')) {
        url = `https://gateway.ipfs.io/${id}`;
      } else {
        url = `https://gateway.ipfs.io/ipns/${id}`;
      }
      break;
    case 'http':
    case 'https':
      break;
  }

  return tokenId ? url.replaceAll('{id}', tokenId) : url;
};

const ensProvider = new AlchemyProvider(Number(NetworkIds.mainnet), process?.env?.NEXT_PUBLIC_ENS_ALCHEMY_API);

export const Avatar = ({
  address,
  sizePx = 20,
  ...boxProps
}: {
  address: string,
  sizePx?: number,

} & Partial<BoxProps>) => {
  const avatarAddress = !address || !isAddress(address) ? '0x0000000000000000000000000000000000000000' : address
  const { ensProfile } = useEnsProfile(avatarAddress, true);
  const blockieUrl = useMemo(() => makeBlockie(avatarAddress), [avatarAddress]);

  const { data: finalUrl } = useCustomSWR(`avatar-uri-${ensProfile?.avatar}`, async (req) => {
    const uri = req?.replace('avatar-uri-', '');
    if (!uri || uri === 'undefined') { return '' }

    const cache = await localforage.getItem(req);
    if(cache) { return cache }

    const match = new RegExp(/([a-z]+):\/\/(.*)/).exec(uri);
    const match721 = new RegExp(/eip155:1\/erc721:(\w+)\/(\w+)/).exec(uri);
    const match1155 = new RegExp(/eip155:1\/erc1155:(\w+)\/(\w+)/).exec(uri);

    let url;

    if (match && match.length === 3) {
      const protocol = match[1];
      const id = match[2];

      switch (protocol) {
        case 'ar': {
          const baseUrl = 'https://arweave.net';

          url = await fetch(`${baseUrl}/graphql`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json;charset=UTF-8',
            },
            body: JSON.stringify({
              query: `
                {
                  transactions(ids: ["${id}"]) {
                    edges {
                      node {
                        id
                        owner {
                          address
                        }
                      }
                    }
                  }
                }
                `,
            }),
          })
            .then(d => d.json())
            .then(res => res.data.transactions.edges[0].node)
            .then(tx =>
              fetch(`${baseUrl}/graphql`, {
                method: 'POST',
                headers: {
                  'content-type': 'application/json;charset=UTF-8',
                },
                body: JSON.stringify({
                  query: `
                  {
                    transactions(owners: ["${tx.owner.address}"], tags: { name: "Origin", values: ["${tx.id}"] }, sort: HEIGHT_DESC) {
                      edges {
                        node {
                          id
                        }
                      }
                    }
                  }
                  `,
                }),
              })
            )
            .then(res => res.json())
            .then(res => {
              if (res.data && res.data.transactions.edges.length > 0) {
                return (`${baseUrl}/${res.data.transactions.edges[0].node.id}`);
              } else {
                return (`${baseUrl}/${id}`);
              }
            })
            .catch(e => console.error(e)); // eslint-disable-line
          break;
        }
        case 'ipfs':
          url = (`https://gateway.ipfs.io/ipfs/${id}`);
          break;
        case 'ipns':
          url = (`https://gateway.ipfs.io/ipns/${id}`);
          break;
        case 'http':
        case 'https':
        default:
          url = uri;
          break;
      }
    } else if (match721 && match721.length === 3) {
      const contractId = match721[1].toLowerCase();
      const tokenId = match721[2];

      const erc721Contract = new Contract(contractId, erc721Abi, ensProvider);

      const tokenURI = await erc721Contract.tokenURI(tokenId);
      const tokenKey = parseUnits(tokenId, 0)._hex.replace(/^0x/, '');
      const res = await fetch(getGatewayUrl(tokenURI, tokenKey));
      const data = (await res.json()) as { image: string, image_url: string };
      url = (getGatewayUrl(data.image || data.image_url));

    } else if (match1155 && match1155.length === 3) {
      const contractId = match1155[1].toLowerCase();
      const tokenId = match1155[2];

      const erc1155Contract = new Contract(contractId, erc1155Abi, ensProvider);

      const tokenURI = await erc1155Contract.uri(tokenId);
      const tokenKey = parseUnits(tokenId, 0)._hex.replace(/^0x/, '');
      const res = await fetch(getGatewayUrl(tokenURI, tokenKey));
      const data = (await res.json()) as { image: string, image_url: string };
      url = (getGatewayUrl(data.image || data.image_url));

    } else {
      url = (getGatewayUrl(uri));
    }
    return url || uri;
  });

  return (
    <Box
      boxSize={`${sizePx}px`}
      backgroundImage={finalUrl ? `url('${finalUrl}')` : undefined}
      backgroundSize="cover"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      borderRadius="50px"
      {...boxProps}>
      {
        !finalUrl && <Image borderRadius="50px" alt="avatar" src={blockieUrl} size={sizePx} />
      }
    </Box>
  )
}

import {
  Box,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'
import * as token from '@solana/spl-token'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { TOKEN_SWAP_PROGRAM_ID, TokenSwap } from '@solana/spl-token-swap'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import * as Web3 from '@solana/web3.js'
import { FC, useState } from 'react'
import {
  ScroogeCoinMint,
  feeAccount,
  kryptMint,
  poolKryptAccount,
  poolMint,
  poolScroogeAccount,
  swapAuthority,
  tokenSwapStateAccount,
} from '../utils/constants'

export const WithdrawSingleTokenType: FC = () => {
  const [poolTokenAmount, setAmount] = useState(0)
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const handleWithdrawSubmit = (event: any) => {
    event.preventDefault()
    handleTransactionSubmit()
  }

  const handleTransactionSubmit = async () => {
    if (!publicKey) {
      alert('Please connect your wallet!')

      return
    }

    const poolMintInfo = await token.getMint(connection, poolMint)

    const kryptATA = await token.getAssociatedTokenAddress(kryptMint, publicKey)
    const scroogeATA = await token.getAssociatedTokenAddress(
      ScroogeCoinMint,
      publicKey,
    )
    const tokenAccountPool = await token.getAssociatedTokenAddress(
      poolMint,
      publicKey,
    )

    const transaction = new Web3.Transaction()

    let account = await connection.getAccountInfo(tokenAccountPool)

    if (account == null) {
      const createATAInstruction = token.createAssociatedTokenAccountInstruction(
        publicKey,
        tokenAccountPool,
        publicKey,
        poolMint,
      )
      transaction.add(createATAInstruction)
    }

    // 构建用于同时从两边的交换池提取代币的指令
    const instruction = TokenSwap.withdrawAllTokenTypesInstruction(
      tokenSwapStateAccount, // token swap 状态账户
      swapAuthority, // 交换池的授权账户
      publicKey, // 用户的转账授权账户
      poolMint, // LP-token 的 mint 地址
      feeAccount, // 接收提取费用的代币账户
      tokenAccountPool, // 用户的 LP-token 账户，用于销毁 LP-token
      poolKryptAccount, // 交换池中的代币 A 账户
      poolScroogeAccount, // 交换池中的代币 B 账户
      kryptATA, // 用户接收代币 A 的账户
      scroogeATA, // 用户接收代币 B 的账户
      TOKEN_SWAP_PROGRAM_ID, // Token Swap 程序的地址
      TOKEN_PROGRAM_ID, // Token 程序的地址
      poolTokenAmount * 10 ** poolMintInfo.decimals, // 用户希望销毁的 LP-token 数量
      0, // 提取代币 A 的最小数量，设为 0 可能会有滑点
      0, // 提取代币 B 的最小数量，设为 0 可能会有滑点
    )

    transaction.add(instruction)
    try {
      let txid = await sendTransaction(transaction, connection)
      alert(
        `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`,
      )
      console.log(
        `Transaction submitted: https://explorer.solana.com/tx/${txid}?cluster=devnet`,
      )
    } catch (e) {
      console.log(JSON.stringify(e))
      alert(JSON.stringify(e))
    }
  }

  return (
    <Box
      p={4}
      display={{ md: 'flex' }}
      maxWidth="32rem"
      margin={2}
      justifyContent="center"
    >
      <form onSubmit={handleWithdrawSubmit}>
        <FormControl isRequired>
          <FormLabel color="gray.200">LP-Token Withdrawal Amount</FormLabel>
          <NumberInput
            max={1000}
            min={1}
            onChange={valueString => setAmount(parseInt(valueString))}
          >
            <NumberInputField id="amount" color="gray.400" />
          </NumberInput>
        </FormControl>
        <Button width="full" mt={4} type="submit">
          Withdraw
        </Button>
      </form>
    </Box>
  )
}

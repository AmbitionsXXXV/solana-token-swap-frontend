import type { NextPage } from 'next'
import Head from 'next/head'
import { Airdrop } from '../components/AirdropForm'
import { AppBar } from '../components/AppBar'
import { TokenSwapForm } from '../components/TokenSwapForm'
import styles from '../styles/Home.module.css'
import { Center, Box } from '@chakra-ui/react'

const Home: NextPage = () => {
  return (
    <div className={styles.App}>
      <Head>
        <title>Token Swap</title>
      </Head>
      <AppBar />
      <Center>
        <Box>
          <Airdrop />
          <TokenSwapForm />
        </Box>
      </Center>
    </div>
  )
}

export default Home

# TonClubs Bot

Source code of the [TonClubs Bot](https://t.me/tonclubstestbot)

## Prerequisites

- Create a new empty PostgreSQL database and get the connection string
- Create a new Telegram bot using [@BotFather](https://t.me/BotFather) and get the bot token
- Create a new AWS S3 bucket, a new AWS IAM user with access to the bucket, and get the access credentials

## Steps to run the bot locally

- Fill in the .env file using the .env.sample file as a template
- Install dependencies (`yarn`)
- Push the Prisma Schema to your database (`yarn prisma db push`)
- Start the bot (`yarn start`)

## Steps to change the Collection and Item Contracts

- Clone the [tonclub-contracts](https://github.com/TonClubs/tonclubs-contracts/tree/post-hackathon) repository
- Follow the instructions in the tonclub-contracts README to prepare the contracts
- Run `yarn compile` in the tonclub-contracts repository
- Copy the compiled contracts from the tonclub-contracts repository to the `src/Contracts/BOCs` folder in this repository

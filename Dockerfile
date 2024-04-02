FROM node:14

WORKDIR /mymedtrust-be
COPY .env .
COPY package.json .
RUN npm install
COPY . .
EXPOSE 3000
CMD npm run dev


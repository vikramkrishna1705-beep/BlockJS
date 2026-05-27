# Use official Node runtime as a parent image
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Start the application
CMD ["npm", "start"]

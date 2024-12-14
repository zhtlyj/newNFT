import { create } from "kubo-rpc-client";

const JWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyYWMzOTM2MC0wZmIxLTRjMDUtOWZjMS1lNDAyZWI0MmRlYjUiLCJlbWFpbCI6IjIyNDE5NzU2OTRAcXEuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjI1NWJmYTA2YTA3YTMzNGZmNmJjIiwic2NvcGVkS2V5U2VjcmV0IjoiYTM1NGFkMjRkNjFkOWE3ZWZhOGY4NDgzODg5ODhjM2FhYTM1ZWVkZWIyNzg0NWIzMTI2YzZhODEyYmM4OTI0YyIsImV4cCI6MTc2NTI3NDY2OX0.TK3SraOxT68q5Pkl7Ody2KViBqdblUdYGyDwvafBqV8`;

export const ipfsClient = create({
  host: "api.pinata.cloud",
  port: 443,
  protocol: "https",
  headers: {
    accept: `application/json`,
    Authorization: `Bearer ${JWT}`,
  },
});

export async function getNFTMetadataFromIPFS(ipfsHash: string) {
  for await (const file of ipfsClient.get(ipfsHash)) {
    // The file is of type unit8array so we need to convert it to string
    const content = new TextDecoder().decode(file);
    // Remove any leading/trailing whitespace
    const trimmedContent = content.trim();
    // Find the start and end index of the JSON object
    const startIndex = trimmedContent.indexOf("{");
    const endIndex = trimmedContent.lastIndexOf("}") + 1;
    // Extract the JSON object string
    const jsonObjectString = trimmedContent.slice(startIndex, endIndex);
    try {
      const jsonObject = JSON.parse(jsonObjectString);
      return jsonObject;
    } catch (error) {
      console.log("Error parsing JSON:", error);
      return undefined;
    }
  }
}

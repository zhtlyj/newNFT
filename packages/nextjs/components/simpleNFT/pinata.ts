// your-pinata-utils.ts

export async function uploadToPinata(file: File): Promise<any> {
  const pinataApiKey = "a562a26bdaed26017719";
  const pinataSecretApiKey = "f2cd0503d960dfab80eed9d376aa2e0a818bce03a56da6c25dded4dd32f040ae";

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("上传到 Pinata 出错");
  }

  const data = await response.json();
  return data;
}

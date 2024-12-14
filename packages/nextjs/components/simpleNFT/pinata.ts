// your-pinata-utils.ts

export async function uploadToPinata(file: File): Promise<any> {
  const pinataApiKey = "255bfa06a07a334ff6bc";
  const pinataSecretApiKey = "a354ad24d61d9a7efa8f848388988c3aaa35eedeb27845b3126c6a812bc8924c";

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

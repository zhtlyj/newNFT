"use client";
import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { notification } from "~~/utils/scaffold-eth";
import { uploadToPinata } from "~~/components/simpleNFT/pinata"; // 你自己的上传到 Pinata 的函数

const IpfsUpload: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [uploadedIpfsPath, setUploadedIpfsPath] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageData, setImageData] = useState<{ id: number, name: string, onChainAddress: string }[]>([]);

  useEffect(() => {
    // 在页面加载时从本地存储中获取已上传的图片数据
    const data: { id: number, name: string, onChainAddress: string }[] = [];
    let id = 1;
    let storedData = localStorage.getItem(`image_${id}`);
    while (storedData) {
      data.push(JSON.parse(storedData));
      id++;
      storedData = localStorage.getItem(`image_${id}`);
    }
    setImageData(data);
  }, []);

  const handleIpfsUpload = async () => {
    if (!image) {
      notification.error("请选择要上传的图片");
      return;
    }

    setLoading(true);
    const notificationId = notification.loading("上传至IPFS中...");
    try {
      const imageUploadedItem = await uploadToPinata(image);

      notification.remove(notificationId);
      notification.success("已上传到IPFS");

      setUploadedIpfsPath(imageUploadedItem.IpfsHash);

      // Store the uploaded image's details in local storage
      const newImageData = {
        id: imageData.length + 1,
        name: image.name,
        onChainAddress: imageUploadedItem.IpfsHash,
      };
      setImageData([...imageData, newImageData]);
      localStorage.setItem(`image_${newImageData.id}`, JSON.stringify(newImageData));
    } catch (error) {
      notification.remove(notificationId);
      notification.error("上传IPFS出错");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <h1 className="text-center mb-4">
          <span className="block text-4xl font-bold">版权上传</span>
        </h1>

        <div className="mb-4">
          <input
            type="file"
            onChange={handleImageChange}
            className="border p-2 w-full"
            accept="image/*"
            required
          />
        </div>
        <button
          className={`btn btn-secondary mt-4 ${loading ? "loading" : ""}`}
          disabled={loading}
          onClick={handleIpfsUpload}
        >
          {loading ? "上传中..." : "上传到IPFS"}
        </button>
        <table className="border-collapse border border-gray-400 w-full mt-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-400 p-2" style={{ color: 'black' }}>ID</th>
              <th className="border border-gray-400 p-2" style={{ color: 'black' }} > Name</th>
              <th className="border border-gray-400 p-2" style={{ color: 'black' }} > On - Chain Address</th>
            </tr>
          </thead>
          <tbody>
            {imageData.map((row) => (
              <tr key={row.id}>
                <td className="border border-gray-400 p-2">{row.id}</td>
                <td className="border border-gray-400 p-2">{row.name}</td>
                <td className="border border-gray-400 p-2">
                  <a href={`https://ipfs.io/ipfs/${row.onChainAddress}`} target="_blank" rel="noreferrer">
                    {`https://ipfs.io/ipfs/${row.onChainAddress}`}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table >
        {uploadedIpfsPath}
      </div >
    </>
  );
};

export default IpfsUpload;

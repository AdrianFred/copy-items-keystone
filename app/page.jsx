"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

function Home() {
  const searchParams = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [serialNumbers, setSerialNumbers] = useState([""]);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);
  const [itemTypes, setItemTypes] = useState([]);
  const [propertyDefinitions, setPropertyDefinitions] = useState([]);

  // Grab values from parameters itemId and token
  const itemId = searchParams.get("itemId");
  const token = searchParams.get("token");
  const itemTypeParam = searchParams.get("itemType");
  const ocpKey = "l0avumqlod0ovdgq8dsfok53rb19e8q1";

  useEffect(() => {
    if (token) {
      fetch("https://e2e-tm-prod-services.nsg-e2e.com/api/item-types?sort=order,name&size=500", {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          "ocp-apim-subscription-key": ocpKey, // Make sure ocpKey is defined
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to fetch item types");
          }
        })
        .then((data) => {
          if (data && Array.isArray(data)) {
            // Check if data is an array
            const itemTypesId = data.reduce((acc, item) => {
              // Ensure item.name exists and use it for the key
              if (item.name) {
                acc[item.name.toLowerCase().replace(/\s+/g, "")] = item;
              }
              return acc;
            }, {});
            setItemTypes(itemTypesId);
          }
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.error("Token is missing");
    }
  }, [token, ocpKey]); // Add ocpKey to dependency array if its value can change

  console.log("itemTypes", itemTypes);

  useEffect(() => {
    if (itemId && token) {
      fetch(`https://e2e-tm-prod-services.nsg-e2e.com/api/items/${itemId}`, {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          "ocp-apim-subscription-key": ocpKey, // Ensure ocpKey is defined somewhere in your component
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Failed to fetch item details");
          }
        })
        .then((data) => {
          setItemDetails(data); // Make sure you have defined a state setter function for itemDetails
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, [itemId, token]); // Add ocpKey to the dependency array if its value can change
  console.log(itemDetails);

  useEffect(() => {
    if (itemTypeParam && itemTypes[itemTypeParam.toLowerCase().replace(/\s+/g, "")]) {
      setPropertyDefinitions(itemTypes[itemTypeParam.toLowerCase().replace(/\s+/g, "")].propertyDefinitions);
    }
  }, [itemTypeParam, itemTypes]);

  console.log("propertyDefinitions", propertyDefinitions);

  const handleQuantityIncrease = () => {
    setQuantity((prevQuantity) => prevQuantity + 1);
    setSerialNumbers((prevSerialNumbers) => [...prevSerialNumbers, ""]);
  };

  const handleQuantityDecrease = () => {
    if (quantity > 1) {
      setQuantity((prevQuantity) => prevQuantity - 1);
      setSerialNumbers((prevSerialNumbers) => prevSerialNumbers.slice(0, -1));
    }
  };

  const handleSerialNumberChange = (index, value) => {
    const newSerialNumbers = [...serialNumbers];
    newSerialNumbers[index] = value;
    setSerialNumbers(newSerialNumbers);
  };

  const togglePropertySelection = (property) => {
    setSelectedProperties((prevSelectedProperties) =>
      prevSelectedProperties.includes(property) ? prevSelectedProperties.filter((p) => p !== property) : [...prevSelectedProperties, property]
    );
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-8">
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Copy Item Settings</h2>
          <div className="flex space-x-2">
            <button
              className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none transition duration-150 ease-in-out shadow-lg"
              onClick={handleQuantityDecrease}
              disabled={quantity <= 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
              </svg>
            </button>
            <span className="flex justify-center items-center text-sm font-semibold">{quantity}</span>
            <button
              className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none transition duration-150 ease-in-out shadow-lg"
              onClick={handleQuantityIncrease}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>

        {serialNumbers.map((_, index) => (
          <div key={index} className="mb-3">
            <label htmlFor={`serial-${index}`} className="text-gray-700">
              Serial Number {index + 1}
            </label>
            <input
              type="text"
              id={`serial-${index}`}
              className="mt-1 w-full p-2 border rounded-lg"
              value={serialNumbers[index]}
              onChange={(e) => handleSerialNumberChange(index, e.target.value)}
            />
          </div>
        ))}

        <div className="mt-4">
          <h3 className="text-lg font-semibold text-gray-700">Properties to copy:</h3>
          <ul className="mt-2 pl-5">
            {propertyDefinitions.map((property) => (
              <li key={property.id} className="mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5"
                    onChange={() => togglePropertySelection(property.name)}
                    checked={selectedProperties.includes(property.name)}
                  />
                  <span className="text-gray-700">{property.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;

"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

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
      fetch("https://e2e-tm-prod-services.nsg-e2e.com/api/item-types?sort=order,name&size=1000", {
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

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
      setQuantity(newQuantity);
      const difference = newQuantity - serialNumbers.length;
      if (difference > 0) {
        setSerialNumbers((prevSerialNumbers) => [...prevSerialNumbers, ...Array(difference).fill("")]);
      } else if (difference < 0) {
        setSerialNumbers((prevSerialNumbers) => prevSerialNumbers.slice(0, newQuantity));
      }
    }
  };

  const createItems = async () => {
    if (!serialNumbers.every((number) => number.trim() !== "")) {
      console.error("All serial numbers must be filled out.");
      toast.error("All serial numbers must be filled out.");
      return;
    }

    function createComprehensivePayload(serialNumber) {
      // Normalize the itemTypeParam to match the keys in itemTypes
      const normalizedItemTypeParam = itemTypeParam.toLowerCase().replace(/\s+/g, "");

      // Retrieve all properties for the selected item type
      const allPropertyDefinitions = itemTypes[normalizedItemTypeParam]?.propertyDefinitions || [];

      // Constructing propertyValues array
      const propertyValues = allPropertyDefinitions.map((def) => {
        // Check if this property is selected
        const isSelected = selectedProperties.includes(def.name);
        // Find the current property value if it exists
        const currentValue = itemDetails.propertyValues.find((pv) => pv.definition.id === def.id);

        // Property structure
        return {
          name: def.name,
          definition: {
            extendedOptions: def.extendedOptions,
            id: def.id,
            name: def.name,
            propertyType: def.propertyType,
            isDefault: def.isDefault,
            options: def.options, // Assuming this contains specifics like options for dropdowns, etc.
            isAdmin: def.isAdmin,
            isMandatory: def.isMandatory,
            order: def.order,
          },
          value: isSelected && currentValue ? currentValue.value : null,
          // id: isSelected && currentValue ? currentValue.id : null,
          id: null,
          itemPropertyNotifications: null,
        };
      });

      // Building the overall payload
      const payload = {
        id: null,
        name: serialNumber,
        propertyValues,
        itemLocation: itemDetails.itemLocation,
        itemNotifications: [],
        nestedItems: [],
        adminPropertyValues: [],
        type: itemTypes[normalizedItemTypeParam],
        typeId: itemTypes[normalizedItemTypeParam].id,
        project: {
          id: itemDetails.project.id,
        },
        lastUpdated: null,
        amount: 1,
      };

      return payload;
    }

    // Construct payloads for all serial numbers
    const payloads = serialNumbers.map((serialNumber) => createComprehensivePayload(serialNumber));

    // Map payloads to fetch promises
    const fetchPromises = payloads.map((payload) => {
      return fetch("https://e2e-tm-prod-services.nsg-e2e.com/api/items?amount=1", {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": ocpKey,
        },
        body: JSON.stringify(payload),
      }).then((response) => {
        if (!response.ok) {
          throw new Error("Failed to create item.");
        }
        return response.json(); // Assuming the API returns a meaningful response on success
      });
    });

    // Use Promise.all to wait for all fetch promises to resolve
    Promise.all(fetchPromises)
      .then((results) => {
        console.log("Items created successfully.", results);
        toast.success("All items were successfully created!");

        // Reset the form
        setQuantity(1);
        setSerialNumbers([""]);
        setSelectedProperties([]);
      })
      .catch((error) => {
        console.error("An error occurred while creating items:", error);
        toast.error("An error occurred while creating one or more items. Please try again.");
      });
  };

  console.log("selectedProperties", selectedProperties);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 py-8">
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">Copy Item Settings</h2>
          <div className="flex space-x-2">
            <button
              className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none transition duration-150 ease-in-out shadow-lg"
              onClick={() => handleQuantityChange({ target: { value: quantity - 1 } })}
              disabled={quantity <= 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
              </svg>
            </button>
            <input type="number" className="w-16 text-center border rounded-md" value={quantity} onChange={handleQuantityChange} min="1" />
            <button
              className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none transition duration-150 ease-in-out shadow-lg"
              onClick={() => handleQuantityChange({ target: { value: quantity + 1 } })}
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
        <div className="mt-6 flex justify-center items-center">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none transition duration-150 ease-in-out"
            onClick={createItems}
          >
            Create Items
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;

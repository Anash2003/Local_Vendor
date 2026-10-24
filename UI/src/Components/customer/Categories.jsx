import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const categoryIcons = {
  "Home Services": "fa-solid fa-screwdriver-wrench",
  "Vehicle Services": "fa-solid fa-car",
  "Tech Services": "fa-solid fa-computer",
  "Personal Care": "fa-solid fa-spa",
  "Moving & Delivery": "fa-solid fa-truck",
  "Pet Maintenance": "fa-solid fa-paw",
};

function Categories() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);

      try {
        const response = await axios.get("/api/categories");
        setCategories(response.data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    navigate(`/category/${category.id}`);
  };

  return (
            <div className="category-icon">

                {category.icon ? (

                    <img
                        src={category.icon}
                        alt={category.category}
                    />

                ) : (

                    <span>
                        <h2>
                        {   category.id === 1
                        ? "🏠"
                        : category.id === 2
                        ? "🚗"
                        : category.id === 3
                        ? "💻"
                        : category.id === 4
                        ? "🧖‍♀️"
                        : category.id === 5
                        ? "📦"
                        : "🐾"
                        }
                        </h2>
                    </span>

                )}

            </div>
  );
}

export default Categories;
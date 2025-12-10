import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import FoodItem from '../FoodItem/FoodItem'; // adjust path as needed
import './SearchResults.css';

// Custom hook to read query params
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

const SearchResults = () => {
    const query = useQuery().get("query");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await fetch(`http://localhost:4000/api/food/search?query=${query}`);
                
                if (response.status === 404) {
                    setResults([]);
                    setError("Food not available");
                } else {
                    const data = await response.json();
                    setResults(data);
                    setError("");
                }
            } catch (err) {
                console.error(err);
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="search-results">
            <h2>Search results for "{query}"</h2>
            <div className="food-display-list">
                {results.map((food) => (
                    <FoodItem
                        key={food._id}
                        id={food._id}
                        name={food.name}
                        price={food.price}
                        description={food.description}
                        image={food.image}
                    />
                ))}
            </div>
        </div>
    );
};

export default SearchResults;

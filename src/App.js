import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch } from 'react-icons/fa';
import Photos from './Components/photos';
import Favourite from './Components/Favourite';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

const clientID = `?client_id=hmtwJ6BfCpQPZpQcUNeLmsd5QuWUMf4TO5zTSE2X1VA`;
const mainUrl = `https://api.unsplash.com/photos/`;
const searchUrl = `https://api.unsplash.com/search/photos/`;

function App() {
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [favoritePhotos, setFavoritePhotos] = useState([]);

  // Debounce function to limit the number of API calls
  const debounce = (func, delay) => {
    let debounceTimer;
    return function (...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // Wrap fetchImages in useCallback to prevent it from being recreated on every render
  const fetchImages = useCallback(async () => {
    setLoading(true);
    let url;
    const urlPage = `&page=${page}`;
    const urlQuery = query ? `&query=${query}` : '';

    if (query) {
      url = `${searchUrl}${clientID}${urlPage}${urlQuery}`;
    } else {
      url = `${mainUrl}${clientID}${urlPage}`;
    }
    try {
      const response = await fetch(url);
      const data = await response.json();
      setPhotos((oldPhotos) => {
        if (query && page === 1) {
          return data.results;
        } else if (query) {
          return [...oldPhotos, ...data.results];
        } else {
          return [...oldPhotos, ...data];
        }
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  }, [page, query]);

  // Debounced fetchImages on form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset page to 1 when searching
    debounce(fetchImages, 300)();
  };

  useEffect(() => {
    fetchImages();
  }, [page, fetchImages]);

  // Infinite scroll event listener
  useEffect(() => {
    const scrollHandler = debounce(() => {
      if (
        !loading &&
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 2
      ) {
        setPage((oldPage) => oldPage + 1);
      }
    }, 300); // Debounce scrolling event
    window.addEventListener('scroll', scrollHandler);

    return () => window.removeEventListener('scroll', scrollHandler);
  }, [loading]);

  const handleFavoriteClick = (photo) => {
    const existingIndex = favoritePhotos.findIndex(
      (favPhoto) => favPhoto.id === photo.id
    );

    if (existingIndex !== -1) {
      setFavoritePhotos((prevFavorites) =>
        prevFavorites.filter((favPhoto) => favPhoto.id !== photo.id)
      );
    } else {
      setFavoritePhotos((prevFavorites) => [...prevFavorites, photo]);
    }
  };

  return (
    <Router>
      <div>
        <nav className="navbar">
          <div className="navbar__logo">Fotoflix</div>
          <form className="navbar__search-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="search"
              className="form-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="submit-btn">
              <FaSearch />
            </button>
          </form>
          <div className="navbar__links">
            <Link to="/favourites">Favourites</Link>
          </div>
        </nav>

        <Routes>
          <Route
            path="/"
            element={
              <main>
                <section className="photos">
                  <div className="photos-center">
                    {photos.map((image, index) => {
                      const isFavorite = favoritePhotos.some(
                        (favPhoto) => favPhoto.id === image.id
                      );
                      return (
                        <Photos
                          key={index}
                          {...image}
                          onFavoriteClick={() => handleFavoriteClick(image)}
                          isFavorite={isFavorite}
                        >
                          {isFavorite ? <span>Added to Favorites</span> : null}
                        </Photos>
                      );
                    })}
                  </div>
                </section>
              </main>
            }
          />
          <Route
            path="/favourites"
            element={
              <Favourite
                favoritePhotos={favoritePhotos}
                handleRemoveFavorite={handleFavoriteClick}
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

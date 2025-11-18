/**
 * Sidebar - Composant générique pour les sidebars contextuelles
 */

import { navigateTo } from '../app.js';

/**
 * Crée et rend une sidebar
 * @param {HTMLElement} container - Conteneur où injecter la sidebar
 * @param {Array} items - Items de la sidebar [{ route, label }]
 * @param {string} activeRoute - Route actuellement active
 * @param {string} parentRoute - Route parente (pour la navigation)
 */
export function renderSidebar(container, items, activeRoute, parentRoute) {
  if (!items || items.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  const currentSubRoute = activeRoute.includes('/') ? activeRoute.split('/').slice(1).join('/') : null;
  
  container.innerHTML = `
    <nav class="sidebar-nav" role="navigation" aria-label="Navigation secondaire">
      <ul class="sidebar-list">
        ${items.map(item => {
          const itemSubRoute = item.route.includes('/') ? item.route.split('/').slice(1).join('/') : null;
          const isActive = currentSubRoute === itemSubRoute || 
                          (currentSubRoute === null && itemSubRoute === items[0].route.split('/').slice(1).join('/'));
          
          return `
            <li class="sidebar-item">
              <button 
                class="sidebar-link ${isActive ? 'active' : ''}"
                data-route="${item.route}"
                aria-current="${isActive ? 'page' : 'false'}"
              >
                ${item.label}
              </button>
            </li>
          `;
        }).join('')}
      </ul>
    </nav>
    
    <style>
      .sidebar-nav {
        width: 100%;
        height: 100%;
        background: var(--card);
        border-right: 1px solid var(--card-border);
        padding: 16px 0;
        overflow-y: auto;
      }
      
      .sidebar-container {
        position: fixed;
        left: 0;
        width: 240px;
        z-index: 99;
        background: var(--card);
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
      }
      
      .sidebar-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      
      .sidebar-item {
        margin: 0;
      }
      
      .sidebar-link {
        width: 100%;
        padding: 12px 20px;
        text-align: left;
        background: transparent;
        border: none;
        color: var(--fg);
        font-size: 0.95rem;
        font-weight: 500;
        cursor: pointer;
        transition: all var(--transition-base);
        border-left: 3px solid transparent;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .sidebar-link:hover {
        background: var(--card-hover);
        color: var(--accent);
      }
      
      .sidebar-link.active {
        background: var(--card-hover);
        color: var(--accent);
        border-left-color: var(--accent);
        font-weight: 600;
      }
      
      .sidebar-link:focus {
        outline: 2px solid var(--accent);
        outline-offset: -2px;
      }
      
      @media (max-width: 768px) {
        .sidebar-container {
          position: relative;
          width: 100%;
          top: auto;
          bottom: auto;
        }
        
        .sidebar-nav {
          width: 100%;
          min-width: 100%;
          border-right: none;
          border-bottom: 1px solid var(--card-border);
          max-height: 200px;
        }
      }
    </style>
  `;
  
  // Event listeners
  container.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      const route = link.dataset.route;
      navigateTo(route);
    });
  });
}

/**
 * Supprime la sidebar
 * @param {HTMLElement} container - Conteneur de la sidebar
 */
export function removeSidebar(container) {
  container.innerHTML = '';
}

export default {
  renderSidebar,
  removeSidebar
};


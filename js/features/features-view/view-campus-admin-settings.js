/**
 * View Campus Admin Settings - Paramètres globaux
 */

import { getSettings, updateSettings } from '../features-control/store-campus-admin.js';

export function renderCampusAdminSettingsView(container) {
  console.log('[View Campus Admin Settings] Rendu de la vue paramètres');
  
  const settings = getSettings();
  
  container.innerHTML = `
    <div style="max-width: 1000px; margin: 24px auto; padding: 0 16px;">
      <div style="margin-bottom: 32px;">
        <h1 style="font-size: 2rem; font-weight: 700; margin-bottom: 8px;">
          ⚙️ Paramètres globaux
        </h1>
        <p style="color: var(--muted); font-size: 1.05rem;">
          Configurez les paramètres globaux de la plateforme
        </p>
      </div>
      
      <form id="settings-form" class="card">
        <h2 style="margin: 0 0 24px; font-size: 1.25rem;">Fonctionnalités</h2>
        
        <div style="display: grid; gap: 20px;">
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" name="feature_social_enabled" ${settings.feature_social_enabled ? 'checked' : ''} 
                   style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <div style="font-weight: 500;">Fonctionnalité Social</div>
              <div style="font-size: 0.85rem; color: var(--muted);">Active/désactive la fonctionnalité Social</div>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" name="feature_ai_theme_studio_enabled" ${settings.feature_ai_theme_studio_enabled ? 'checked' : ''} 
                   style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <div style="font-weight: 500;">AI Theme Studio</div>
              <div style="font-size: 0.85rem; color: var(--muted);">Active/désactive l'AI Theme Studio</div>
            </div>
          </label>
          
          <label style="display: flex; align-items: center; gap: 12px; cursor: pointer;">
            <input type="checkbox" name="feature_demo_mode_enabled" ${settings.feature_demo_mode_enabled ? 'checked' : ''} 
                   style="width: 20px; height: 20px; cursor: pointer;">
            <div>
              <div style="font-weight: 500;">Mode démo</div>
              <div style="font-size: 0.85rem; color: var(--muted);">Active/désactive le mode démo</div>
            </div>
          </label>
        </div>
        
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--card-border);">
          <h2 style="margin: 0 0 24px; font-size: 1.25rem;">Données</h2>
          
          <div>
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">
              Durée de rétention des données (années)
            </label>
            <input type="number" name="data_retention_years" value="${settings.data_retention_years}" min="1" max="10"
                   style="width: 100%; max-width: 200px; padding: 8px; border: 1px solid var(--card-border); border-radius: var(--radius-md);">
            <div style="font-size: 0.85rem; color: var(--muted); margin-top: 4px;">
              Les données seront conservées pendant cette durée avant suppression automatique
            </div>
          </div>
        </div>
        
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--card-border);">
          <button type="submit" class="btn primary">Enregistrer les modifications</button>
        </div>
      </form>
    </div>
  `;
  
  setupEventListeners(container);
}

function setupEventListeners(container) {
  const form = document.getElementById('settings-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      updateSettings({
        feature_social_enabled: formData.get('feature_social_enabled') === 'on',
        feature_ai_theme_studio_enabled: formData.get('feature_ai_theme_studio_enabled') === 'on',
        feature_demo_mode_enabled: formData.get('feature_demo_mode_enabled') === 'on',
        data_retention_years: parseInt(formData.get('data_retention_years'))
      });
      alert('Paramètres enregistrés avec succès !');
      renderCampusAdminSettingsView(container);
    });
  }
}


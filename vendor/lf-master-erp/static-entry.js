/**
 * LF-master 路由页统一入口，打包为静态 IIFE（供 MDM/*.html 挂载）
 */
import { render as renderWelcome } from './js/pages/welcome.js';
import { render as renderArchiveStore } from './js/pages/store-settings.js';
import { render as renderArchiveSupplier } from './js/pages/supplier-settings.js';
import { render as renderArchiveWarehouse } from './js/pages/warehouse-settings.js';
import { render as renderArchiveLiveRoom } from './js/pages/live-room-archive.js';
import { render as renderArchiveCarrier } from './js/pages/archive-carrier.js';
import { render as renderPartyStore } from './js/pages/mdm-party-store.js';
import { render as renderPartySupplier } from './js/pages/mdm-party-supplier.js';
import { render as renderPartyWarehouse } from './js/pages/mdm-party-warehouse.js';
import { render as renderPartyLiveRoom } from './js/pages/mdm-party-live-room.js';
import { render as renderPartyCarrier } from './js/pages/mdm-party-carrier.js';
import { render as renderPeopleBd } from './js/pages/mdm-people-bd.js';
import { render as renderPeopleDriver } from './js/pages/mdm-people-driver.js';
import { render as renderPeopleAnchor } from './js/pages/mdm-people-anchor.js';
import { render as renderMemberC } from './js/pages/mdm-member-c.js';
import { render as renderAuditStoreRegistration } from './js/pages/audit-store-registration.js';
import { render as renderSuperAdminAccounts } from './js/pages/super-admin-accounts.js';

const ROUTES = {
  dashboard: renderWelcome,
  'archive-store': renderArchiveStore,
  'archive-supplier': renderArchiveSupplier,
  'archive-warehouse': renderArchiveWarehouse,
  'archive-live-room': renderArchiveLiveRoom,
  'archive-carrier': renderArchiveCarrier,
  'party-store': renderPartyStore,
  'party-supplier': renderPartySupplier,
  'party-warehouse': renderPartyWarehouse,
  'party-live-room': renderPartyLiveRoom,
  'party-carrier': renderPartyCarrier,
  'people-bd': renderPeopleBd,
  'people-driver': renderPeopleDriver,
  'people-anchor': renderPeopleAnchor,
  'member-c-end': renderMemberC,
  'audit-store-registration': renderAuditStoreRegistration,
  'super-admin-accounts': renderSuperAdminAccounts,
};

function mount(routeId, container) {
  const fn = ROUTES[routeId];
  if (!container) return;
  if (typeof fn !== 'function') {
    container.textContent = '未知路由: ' + String(routeId || '');
    return;
  }
  fn(container);
}

window.LfMdmApp = {
  mount,
  routes: Object.freeze(Object.keys(ROUTES)),
};


import { NavLink } from "react-router-dom";


const menuItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: "bi-grid-1x2" },
  { label: "Vendors", path: "/admin/vendors", icon: "bi-shop" },
  { label: "Customers", path: "/admin/customers", icon: "bi-people" },
  { label: "Bookings", path: "/admin/bookings", icon: "bi-calendar-check" },
  { label: "Categories", path: "/admin/categories", icon: "bi-grid" },
  { label: "Services", path: "/admin/services", icon: "bi-tools" },
  { label: "Reviews", path: "/admin/reviews", icon: "bi-star" },
  { label: "Availability", path: "/admin/availability", icon: "bi-calendar-week" },
  { label: "Admin Accounts", path: "/admin/accounts", icon: "bi-person-gear" },
];

function AdminSidebar({ isOpen = false, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? "show" : ""}`}>
        <div className="admin-sidebar-brand">
          <span className="fw-bold fs-4">
            ஊர்<span className="admin-brand-highlight">க்காரன்</span>
          </span>
          <span className="admin-sidebar-subtitle">Administration</span>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin/dashboard"}
              className={({ isActive }) =>
                `admin-sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <i className={`bi ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <i className="bi bi-shield-check" aria-hidden="true" />
          <span>Oorkaran Admin Panel</span>
        </div>
      </aside>
    </>
  );
}

export default AdminSidebar;

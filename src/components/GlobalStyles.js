import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  body {
    background: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
    font-family: "Poppins", "Helvetica Neue", sans-serif;
  }

  .popover {
    font-family: "Poppins", "Helvetica Neue", sans-serif;
    font-size: 0.95rem;
    background: ${({ theme }) => theme.body};
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
  }

  /* Needed to have the triangle match the background of the popover */
  .popover.bs-popover-top .arrow {
    &:after {
      border-top-color: ${({ theme }) => theme.body};
    }

    &:before {
      border-top-color: ${({ theme }) => theme.border};
    }
  }

  .popover.bs-popover-right .arrow {
    &:after {
      border-right-color: ${({ theme }) => theme.body};
    }

    &:before {
      border-right-color: ${({ theme }) => theme.border};
    }
  }

  .popover.bs-popover-bottom .arrow {
    &:after {
      border-bottom-color: ${({ theme }) => theme.body};
    }

    &:before {
      border-bottom-color: ${({ theme }) => theme.border};
    }
  }

  .popover.bs-popover-left .arrow {
    &:after {
      border-left-color: ${({ theme }) => theme.body};
    }

    &:before {
      border-left-color: ${({ theme }) => theme.border};
    }
  }

  .modal {
    z-index: 2010;

    .close {
      color: ${({ theme }) => theme.text};
    }
  }

  .modal-content {
    border-radius: 15px;
  }

  .modal-content,
  .dropdown-menu {
    background: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
  }

  .dropdown-menu {
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
  }

  .App .navbar .navbar-nav .dropdown-item {
    color: ${({ theme }) => theme.text};
  }

  .dropdown-item {
    color: ${({ theme }) => theme.text};
  }

  .dropdown-divider {
    border-top: 1px solid ${({ theme }) => theme.border};
  }

  .dropdown-item.active {
    background: ${({ theme }) => theme.body};
  }

  .dropdown-item:focus,
  .dropdown-item:hover,
  .dropdown-item.active:hover {
    background: ${({ theme }) => theme.backgroundLight};
  }

  .modal-header {
    border-bottom: 1px solid ${({ theme }) => theme.border};
  }

  .bs-popover-bottom {
    .arrow:after {
      border-bottom-color: ${({ theme }) => theme.body};
    }

    .arrow:before {
      border-bottom-color: ${({ theme }) => theme.border};
    }
  }

  a {
    color: ${({ theme }) => theme.link};

    &:hover {
      color: ${({ theme }) => theme.linkHover};
    }
  }

  .alert a {
    color: ${({ theme }) => theme.alertLink};

    &:hover {
      color: ${({ theme }) => theme.alertLinkHover};
    }
  }

  p,
  ul li {
    color: ${({ theme }) => theme.text};
  }

  .text-muted {
    color: ${({ theme }) => theme.textMuted} !important;
  }

  a.text-primary,
  button.text-primary {
    color: ${({ theme }) => theme.linkPrimary} !important;

    &:hover {
      color: ${({ theme }) => theme.linkPrimaryHover} !important;
    }
  }

  a.text-dark {
    color: ${({ theme }) => theme.link} !important;

    &:hover,
    &:focus {
      color: ${({ theme }) => theme.linkHover} !important;
    }
  }

  .EditorPanel .btn-link {
    color: ${({ theme }) => theme.linkPrimary} !important;

    &:hover {
      color: ${({ theme }) => theme.linkPrimaryHover} !important;
    }
  }

  hr {
    border-top: 1px solid ${({ theme }) => theme.border};
  }

  .btn {
    border-radius: 8px;
    min-height: 40px;
    margin-top: 20px;
  }

  .border {
    border: 1px solid ${({ theme }) => theme.border} !important;
  }

  .border-bottom {
    border-bottom: 1px solid ${({ theme }) => theme.border} !important;
  }

  .form-control,
  textarea {
    background: ${({ theme }) => theme.body};
    border: 1px solid ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.text};

    :focus {
      background: ${({ theme }) => theme.body};
      color: ${({ theme }) => theme.text};
    }
  }

  .form-control:disabled,
  .form-control[readonly] {
    background: ${({ theme }) => theme.disabledInput};
  }

  .list-group-item {
    background-color: ${({ theme }) => theme.body};
  }

  .bg-light {
    background-color: ${({ theme }) => theme.backgroundLight} !important;
  }

  .App .navbar {
    background: ${({ theme }) => theme.primary};
    z-index: 2000;
  }

  .App input.rbt-input-hint {
    color: ${({ theme }) => theme.searchTextFocus} !important;
    opacity: 0.75;
  }

  .App .navbar .search-form input {
    background: ${({ theme }) => theme.secondary};
    color: ${({ theme }) => theme.searchText};
  }

  .App .navbar .search-form input:focus {
    background: ${({ theme }) => theme.searchFocus};
    color: ${({ theme }) => theme.searchTextFocus} !important;
  }

  .nav-tabs {
    border-bottom: 1px solid ${({ theme }) => theme.border};
    justify-content: center;

    .nav-link.active {
      background-color: ${({ theme }) => theme.body};
      border-color: transparent;
      position: relative;

      &:after {
        position: absolute;
        width: 100%;
        height: 3px;
        background: #ff9700;
        bottom: -1px;
        left: 0;
        content: "";
        border-radius: 5px 5px 0 0;
      }
    }

    .nav-link:hover {
      border-color: transparent;
    }
  }

  .ChordsPopup .carousel-control-next,
  .ChordsPopup .carousel-control-prev {
    filter: ${({ theme }) =>
      theme.name === "light" ? "invert(100%)" : "none"};
  }

  .ChordsPopup .carousel-indicators {
    filter: ${({ theme }) =>
      theme.name === "light" ? "invert(100%)" : "none"};
  }

  .EditorPanel {
    background: ${({ theme }) => theme.body};
    border: 1px solid ${({ theme }) => theme.border};

    .btn-group .btn span {
      color: ${({ theme }) => theme.text};
    }
  }

  .Content .header-meta-container h4 {
    color: ${({ theme }) => theme.secondaryAltHeading};
  }

  .Content .header-meta-container {
    border-bottom: 2px solid ${({ theme }) => theme.border} !important;
  }

  /* Small devices (landscape phones, less than 768px) */
  @media (max-width: 767.98px) {
    .Content .ad {
      background: ${({ theme }) => theme.body};
    }

    .Request .ad {
      background: ${({ theme }) => theme.body};
    }
  }

  /* Medium devices (tablets, less than 992px) */
  @media (max-width: 991.98px) {
    .Contributions .delete-container {
      background: ${({ theme }) => theme.body};
    }

    .Admin .delete-container {
      background: ${({ theme }) => theme.body};
    }

    .App .navbar .dropdown-menu {
      border-radius: 10px;
      background: ${({ theme }) => theme.primaryDark};
    }

    .dropdown-item.active {
      background: ${({ theme }) => theme.primaryDark};
    }

    .App .navbar .navbar-nav .dropdown-menu .dropdown-divider {
      border-top: 1px solid ${({ theme }) => theme.primary};
    }

    .App .navbar .search-form.show-search {
      background: ${({ theme }) => theme.primary};
    }

    .App .navbar .search-form .dropdown-menu {
      background: ${({ theme }) => theme.body};
      border: 1px solid ${({ theme }) => theme.border};
    }

    .App .navbar .navbar-nav .dropdown-item {
      color: ${({ theme }) => theme.dropdownText};
    }
  }
`;

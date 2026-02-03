import { Table } from "react-bootstrap";
import styled, { css } from "styled-components";

// Helper for adding scroll shadow gradient background
const scrollShadowBackground = (mainColor, percent = "20%") => css`
  background:
    linear-gradient(to right, ${mainColor} ${percent}, rgba(46, 46, 46, 0)),
    linear-gradient(to left, ${mainColor} ${percent}, rgba(46, 46, 46, 0)),
    radial-gradient(
      farthest-side at left center,
      rgba(0, 0, 0, 0.35),
      transparent
    ),
    radial-gradient(
      farthest-side at right center,
      rgba(0, 0, 0, 0.35),
      transparent
    );
  background-repeat: no-repeat;
  background-size:
    30px 100%,
    30px 100%,
    10px 100%,
    10px 100%;
  background-position:
    left center,
    right center,
    left center,
    right center;
  background-attachment: local, local, scroll, scroll;
`;

export const TitleContainer = styled.div`
  overflow: auto;
  padding: 0 15px 3px 15px;
  border-bottom: 1px solid
    ${({ theme, borderBottom }) =>
      borderBottom ? theme.border : "transparent"};

  a.random-post {
    color: ${({ theme }) => theme.linkPrimary};

    &:hover {
      color: ${({ theme }) => theme.linkPrimaryHover};
    }
  }
`;

export const PostListH6 = styled.h6`
  color: ${({ theme }) => theme.secondaryText};
  margin-top: 0;
  float: left;
`;

export const PostItemContainer = styled.div`
  transition: all 0.5s;
  padding: 12.5px 15px;
  background: ${({ alternate, theme }) =>
    alternate ? theme.backgroundLight : "none"};
  border-radius: 15px;

  &:hover {
    background: ${({ theme }) => theme.backgroundHighlight};
  }

  &.no-hover {
    cursor: initial;
    transition: none;
  }

  &.no-hover:hover {
    background: inherit !important;
  }

  a:hover {
    text-decoration: none;
  }

  h5 {
    margin-bottom: 0.25rem;
    margin-top: 0;
    width: fit-content;

    &:hover {
      text-decoration: underline;
    }
  }

  &.loading {
    h5 {
      width: auto;
    }
  }

  small {
    color: ${({ theme }) => theme.secondaryText};
    font-size: 80%;
  }

  small.post-item-meta {
    display: inline-block;
    width: 100%;
    line-height: 1.65;
  }

  small span.separator {
    margin: 0 2.5px;
  }

  /* Extra small devices (portrait phones, less than 576px) */
  @media (max-width: 575.98px) {
    small span.separator {
      display: inline-block;
      margin: 0 5px;
    }

    small .post-rating.post-list span.separator {
      display: none;
    }
  }
`;

export const SidebarWidgetContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.backgroundLight};
  padding: 0 15px;
  border-radius: 15px;

  .nav-tabs .nav-link.active {
    background: ${({ theme }) => theme.backgroundLight};
  }
`;

export const SidebarContainer = styled.div`
  z-index: 2;
  margin-top: -30px;
  transition: all 0.25s;
  height: 100%;
  background: ${({ theme }) => theme.body};

  h6 {
    color: ${({ theme }) => theme.secondaryText};
  }

  .top-posts a {
    color: ${({ theme }) => theme.text};
  }

  .top-posts ol li:before {
    color: ${({ theme }) => theme.secondaryText};
  }

  a h6 {
    color: ${({ theme }) => theme.linkMuted};
  }

  a.active h6 {
    color: ${({ theme }) => theme.text};
  }
`;

export const SidebarPillContainer = styled.div`
  height: 100%;

  .nav-pills {
    background: ${({ theme }) => theme.backgroundLight};
  }
`;

export const AdminTableContainer = styled.div`
  table {
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
    border-collapse: separate;
    border-spacing: 0;

    thead th {
      border-bottom: 0;
      border-top: 0;
    }

    td {
      border-top: 1px solid ${({ theme }) => theme.border};
    }
  }
`;

export const ContentContainer = styled.div`
  h6 {
    color: ${({ theme }) => theme.secondaryHeading};
  }

  .post small {
    color: ${({ theme }) => theme.secondaryText};
  }
`;

export const ContentParserContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 3px 15px 15px;
  border-radius: 15px;

  .tabs {
    ${({ theme }) => scrollShadowBackground(theme.body, "20%")}
  }

  .nav-tabs {
    ${({ theme }) => scrollShadowBackground(theme.body, "20%")}
  }

  @media (max-width: 767.98px) {
    padding-bottom: 0;
    border-bottom: 0;
  }
`;

export const AuthenticatedContentContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 3px 15px 15px;
  border-radius: 15px;

  nav {
    font-family: "Poppins", "Helvetica Neue", sans-serif;
    margin-bottom: 20px;
  }

  .tabs {
    ${({ theme }) => scrollShadowBackground(theme.body, "20%")}
  }

  .nav-tabs {
    ${({ theme }) => scrollShadowBackground(theme.body, "20%")}
  }
`;

export const AuthenticatedTableContainer = styled.div`
  ${({ theme }) => scrollShadowBackground(theme.body, "20%")}
  overflow: scroll;
  scrollbar-width: none;

  table {
    margin-bottom: 0;
  }
`;

export const RatePostContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 15px;
  border-radius: 15px;
  margin-top: 30px;
  background: ${({ theme }) => theme.backgroundLight};

  h6 {
    margin-top: 5px;
  }
`;

export const ScaleInfoContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.backgroundLight};
  border-radius: 15px;

  p {
    font-size: 16px;
  }
`;

export const ChordControlsContainer = styled.div`
  .tray-saver {
    background: ${({ theme }) => theme.backgroundLight};
    border: 1px solid ${({ theme }) => theme.border};
    border-bottom: 0;
  }

  .btn-outline-light {
    border: 1px solid ${({ theme }) => theme.border};
    border-radius: 8px;
  }

  .btn.disabled {
    opacity: 0.4;
  }

  .controls-tray {
    background: ${({ theme }) => theme.backgroundLight};
    border: 1px solid ${({ theme }) => theme.border};
  }

  .tray-control {
    color: ${({ theme }) => theme.text};

    :hover {
      color: ${({ theme }) => theme.linkHover};
    }
  }

  @media (max-width: 575.98px) {
    .controls-container-holder {
      ${({ theme }) => scrollShadowBackground(theme.backgroundLight, "0%")}
    }
  }
`;

export const CommentsContainer = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
  padding: 15px;
  border-radius: 15px;
  margin-top: 15px;

  h6 {
    margin-top: 5px;
  }
`;

export const CommentAuthorName = styled.small`
  &&& {
    color: ${({ theme }) => theme.link};
    padding-right: 4px;
  }
`;

export const SignupCard = styled.div`
  border: 1px solid ${({ theme }) => theme.border};
`;

export const LoginDividerText = styled.span`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  margin-top: -24px;
  background: ${({ theme }) => theme.body};
  width: 40px;
  text-align: center;
`;

import styled from "styled-components";
import { Col } from "react-bootstrap";

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

  h5 {
    margin-bottom: 0;
    margin-top: 0;
  }

  small {
    color: ${({ theme }) => theme.secondaryText};
    font-size: 80%;
  }

  small.post-item-meta {
    display: inline-block;
    width: 100%;
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

export const SidebarCol = styled(Col)`
  border-left: 1px solid ${({ theme }) => theme.border};
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
    color: ${({ theme }) => theme.link};
  }
`;

export const ContentContainer = styled.div`
  h6 {
    color: ${({ theme }) => theme.secondaryHeading};
  }
`;

export const ScaleInfoContainer = styled.div`
  border-left: 3px solid ${({ theme }) => theme.border};
  background: ${({ theme }) => theme.backgroundLight};

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
`;

export const CommentAuthorName = styled.small`
  &&& {
    color: ${({ theme }) => theme.link};
    padding-right: 4px;
  }
`;

import React, { Fragment, useState, useRef } from "react";
import { LoadingButton } from "@mui/lab";
import { Grid, SelectChangeEvent, TextField } from "@mui/material";
import LinkPreviewCard from "./LinkPreviewCard";
import {
  CardType,
  Customization,
  customizationObj,
  LinkPreviewResponse,
  noResponseObj,
  urlPattern,
} from "../helper";
import LinkPreviewSkeleton from "./LinkPreviewSkeleton";
import LinkPreviewTwitterCard from "./LinkPreviewTwitterCard";
import Customizations from "./Customizations";

const domtoimage = require("dom-to-image");

const LinkPreview: React.FunctionComponent = () => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<LinkPreviewResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [showCustomizations, setShowCustomizations] = useState<boolean>(false);
  const [cardType, setCardType] = useState<CardType>("Type 1");
  const [customization, setCustomization] =
    useState<Customization>(customizationObj);

  const linkPreviewRef = useRef(null);

  const handleLinkPreviewDownload = async () => {
    const dataUrl = await domtoimage.toPng(linkPreviewRef.current);
    const link = document.createElement("a");
    link.download = "link-preview-react.png";
    link.href = dataUrl;
    link.click();
  };

  const handleUrlChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (error !== "") setError("");
    setUrl(e.target.value);
  };

  const handleCardTypeChange = (e: SelectChangeEvent) => {
    const newCustomization = { ...customization };

    if (e.target.value === "Type 1") {
      newCustomization.cardWidth = 300;
      newCustomization.cardRadius = 15;
      newCustomization.imageRadius = 7;
    } else {
      newCustomization.cardWidth = 600;
      newCustomization.cardRadius = 35;
      newCustomization.imageRadius = 0;
    }
    newCustomization.cardHeight = 0;

    setCustomization(newCustomization);
    setCardType(e.target.value as CardType);
  };

  const handleCustomizationChange = (key: string, value: number) => {
    const newCustomization: Customization = { ...customization };

    if (
      key === "cardRadius" ||
      key === "cardWidth" ||
      key === "cardHeight" ||
      key === "imageRadius"
    ) {
      newCustomization[key] = value;
    }

    setCustomization(newCustomization);
  };

  const checkError = () => {
    if (response) {
      setResponse(null);
    }

    if (url === "") {
      setError("Please enter an url to continue");
      return true;
    }

    if (!urlPattern.test(url)) {
      setError("Please Enter a valid url!");
      return true;
    }

    return false;
  };

  const handleResponseRejection = () => {
    if (response == null) {
      fetch(
        `https://api.linkpreview.net/?key=a0048732a8701a66fecbddf3f5ba40e0&q=${url}`
      )
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          return Promise.reject(response.status);
        })
        .then((resp: LinkPreviewResponse) => {
          if (resp.publisher == null) {
            resp.publisher = noResponseObj.publisher;
          }
          setResponse(resp);
        })
        .then(() => setUrl(""))
        .then(() => setLoading(false))
        .catch((error) => {
          console.log("error", error);
          setResponse(noResponseObj);
          setUrl("");
          setLoading(false);
        });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (checkError()) return;

    setLoading(true);

    fetch(
      `https://v1.nocodeapi.com/20010349/link_preview/SBpgGHsbTkmhONvx?url=${url}`
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        return Promise.reject(response.status);
      })
      .then((resp: LinkPreviewResponse) => setResponse(resp))
      .then(() => setUrl(""))
      .then(() => setLoading(false))
      .catch((error) => {
        console.log("error", error);
        handleResponseRejection();
      });
  };

  const clear = (e: React.MouseEvent) => {
    e.preventDefault();
    setResponse(null);
    setUrl("");
    setCardType("Type 1");
    setCustomization(customizationObj);
    setShowCustomizations(false);
  };

  return (
    <div className="link-preview">
      <form onSubmit={handleSubmit}>
        <Grid
          container
          rowSpacing={2}
          justifyContent="center"
          alignItems="center"
        >
          <Grid item xs={12} md={6} lg={5}>
            <TextField
              id="url-input"
              error={!!error}
              label="Enter an URL for preview"
              helperText={error}
              value={url}
              onChange={handleUrlChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            {response && !url ? (
              <LoadingButton
                variant="contained"
                color="secondary"
                size="large"
                onClick={clear}
              >
                Clear
              </LoadingButton>
            ) : (
              <LoadingButton
                type="submit"
                variant="contained"
                color="secondary"
                size="large"
                loading={loading}
              >
                Get Link Preview
              </LoadingButton>
            )}
          </Grid>
        </Grid>
      </form>
      {loading ? (
        <LinkPreviewSkeleton />
      ) : (
        response && (
          <Fragment>
            <div style={{ padding: "10px" }} ref={linkPreviewRef}>
              {cardType === "Type 1" ? (
                <LinkPreviewCard
                  response={response}
                  customization={customization}
                />
              ) : (
                <LinkPreviewTwitterCard
                  response={response}
                  customization={customization}
                />
              )}
            </div>
            <LoadingButton
              variant="contained"
              color="secondary"
              onClick={() => setShowCustomizations(!showCustomizations)}
              sx={{ margin: "20px" }}
            >
              {!showCustomizations
                ? "Customize"
                : "Hide Customization Settings"}
            </LoadingButton>
            <LoadingButton
              variant="contained"
              color="secondary"
              onClick={() => handleLinkPreviewDownload()}
              sx={{ margin: "20px" }}
            >
              Download Preview
            </LoadingButton>
            {showCustomizations && (
              <Customizations
                cardType={cardType}
                handleCardTypeChange={handleCardTypeChange}
                customization={customization}
                handleCustomizationChange={handleCustomizationChange}
              />
            )}
          </Fragment>
        )
      )}
    </div>
  );
};

export default LinkPreview;

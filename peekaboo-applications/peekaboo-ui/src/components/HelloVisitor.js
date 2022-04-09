import React, { useEffect, useState } from "react";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import axios from "axios";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import GridList from "@material-ui/core/GridList";
import GridListTile from "@material-ui/core/GridListTile";
import GridListTileBar from "@material-ui/core/GridListTileBar";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import DeleteIcon from "@material-ui/icons/Delete";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import Card from "@material-ui/core/Card";
import Grid from "@material-ui/core/Grid";
import LinearProgress from "@material-ui/core/LinearProgress";
import { DataGrid } from "@material-ui/data-grid";

const HVUpload = () => {
  const [file, setFile] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
    setPrediction(null);
    const reader = new FileReader();

    reader.addEventListener(
      "load",
      () => {
        setImageData(reader.result);
      },
      false
    );

    reader.readAsDataURL(event.target.files[0]);
  };

  const onFileUpload = () => {
    // Create formData object
    const formData = new FormData();
    formData.append("image", file, file.name);
    setLoading(true);

    // Send request with Axios
    axios
      .post(process.env.REACT_APP_HV_API + "/upload", formData)
      .then((res) => {
        setPrediction(res?.data ? res.data : null);
        setLoading(false);
      })
      .catch((err) => {
        setPrediction(null);
        setLoading(false);
      });
  };

  const fileData = () => {
    if (loading) {
      return (
        <div>
          <h3>Processing...</h3>
        </div>
      );
    } else if (prediction) {
      return (
        <div>
          <h2>Prediction</h2>
          <p>
            Name:{" "}
            {prediction.prediction ? (
              prediction.prediction
            ) : (
              <em>Not Found in Database</em>
            )}
          </p>
          <p>
            Score:{" "}
            {prediction.score && prediction.score !== 0
              ? prediction.score
              : "N/A"}
          </p>
        </div>
      );
    } else if (file) {
      return (
        <div>
          <h2>File Details</h2>
          <p>File Name: {file.name}</p>
          <p>File Type: {file.type}</p>
          <p>Last Modified: {file.lastModifiedDate.toDateString()}</p>
        </div>
      );
    } else {
      return (
        <div>
          <br />
          <h4>Select a file to upload</h4>
        </div>
      );
    }
  };

  return (
    <div>
      <h3>Upload an image</h3>
      <div>
        <Button
          variant="contained"
          component="label"
          style={{ marginRight: "1em" }}
        >
          Select File
          <input
            type="file"
            onChange={onFileChange}
            accept="image/x-png,image/gif,image/jpeg"
            hidden
          />
        </Button>
        <Button variant="contained" color="secondary" onClick={onFileUpload}>
          Upload
        </Button>
      </div>
      {imageData ? (
        <div style={{ marginTop: "2em" }}>
          <img src={imageData} height="200" alt="Preview" />
        </div>
      ) : null}
      {fileData()}
    </div>
  );
};

const ImageList = ({ images, selected, setSelected }) => {
  const onSelect = (i) => {
    const newSelected = [...selected];
    newSelected[i] = !newSelected[i];
    setSelected(newSelected);
  };

  return (
    <GridList cellHeight={160} cols={3}>
      {images.map((image, i) => (
        <GridListTile key={i} cols={1} rows={2}>
          <img src={`data:image;base64,${image.data}`} alt="Preview" />
          <GridListTileBar
            actionIcon={
              <IconButton
                aria-label={`select ${i}`}
                onClick={() => {
                  onSelect(i);
                }}
              >
                {selected[i] ? (
                  <CheckBoxIcon color="primary" />
                ) : (
                  <CheckBoxOutlineBlankIcon color="primary" />
                )}
              </IconButton>
            }
          />
        </GridListTile>
      ))}
    </GridList>
  );
};

const ImageUploads = ({ imageData, images, fileDelete }) => {
  if (Array.isArray(imageData) && imageData.length > 0) {
    return (
      <>
        {imageData.map((image, i) => (
          <div
            style={{
              height: "auto",
              padding: "1%",
              width: "100%",
              float: "left",
              marginBottom: "1em",
            }}
          >
            <div>
              <img
                src={image}
                height={100}
                style={{ float: "left" }}
                alt="Preview"
              />
            </div>
            <div style={{ marginLeft: "10px", display: "inline" }}>
              {images ? images[i].name : null}
            </div>
            <div style={{ marginLeft: "10px", display: "inline" }}>
              <IconButton
                aria-label={`delete ${images[i].name}`}
                onClick={() => {
                  fileDelete(i);
                }}
              >
                <DeleteIcon />
              </IconButton>
            </div>
          </div>
        ))}
      </>
    );
  } else return null;
};

const CreateProfileDialog = (props) => {
  const { open, onClose } = props;
  const [name, setName] = useState("");
  const [imageList, setImageList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [fileDataList, setFileDataList] = useState([]);

  const handleClose = () => {
    setName("");
    setImageList([]);
    setSelected([]);
    setFileList([]);
    setFileDataList([]);
    onClose();
  };

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("name", name);
    for (let i = 0; i < selected.length; i++) {
      if (selected[i]) {
        formData.append("references", imageList[i].filename);
      }
    }
    for (let file of fileList) {
      formData.append("uploads", file, file.name);
    }
    handleClose();
    axios.post(process.env.REACT_APP_HV_API + "/profile/create", formData);
  };

  const onFileChange = (event) => {
    setFileList([...fileList, ...event.target.files]);
    const reader = new FileReader();

    reader.addEventListener(
      "load",
      () => {
        setFileDataList([...fileDataList, reader.result]);
      },
      false
    );

    reader.readAsDataURL(event.target.files[0]);
  };

  const fileDelete = (i) => {
    const newFileList = [...fileList];
    newFileList.splice(i, 1);
    setFileList(newFileList);

    const newFileDataList = [...fileDataList];
    newFileDataList.splice(i, 1);
    setFileDataList(newFileDataList);
  };

  useEffect(() => {
    if (props.open)
      axios
        .get(process.env.REACT_APP_HV_API + "/images/unrecognized")
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setImageList(res.data);
            setSelected(Array(res.data.length).fill(false));
          }
        });
  }, [props.open]);

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      scroll="paper"
      maxWidth="md"
      aria-labelledby="create-profile-title"
    >
      <DialogTitle id="create-profile-title">Create Profile</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This form creates a new profile in the database from selected images.
        </DialogContentText>
        <TextField
          required
          margin="dense"
          id="name"
          label="Name"
          type="text"
          variant="outlined"
          fullWidth
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
        <Divider
          variant="middle"
          style={{ marginTop: "2em", marginBottom: "2em" }}
        />
        <DialogContentText>
          Select a few things from this list
        </DialogContentText>
        {imageList ? (
          <ImageList
            images={imageList}
            selected={selected}
            setSelected={setSelected}
          />
        ) : (
          <Typography>No existing images.</Typography>
        )}
        <Divider
          variant="middle"
          style={{ marginTop: "2em", marginBottom: "2em" }}
        />
        <DialogContentText>Upload additional images to use</DialogContentText>
        <ImageUploads
          imageData={fileDataList}
          images={fileList}
          fileDelete={fileDelete}
        />
        <Button variant="contained" component="label">
          Add File From Computer
          <input
            type="file"
            onChange={onFileChange}
            accept="image/x-png,image/gif,image/jpeg"
            hidden
          />
        </Button>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary">
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ManageProfileDialog = (props) => {
  const { open, onClose } = props;
  const [data, setData] = useState([]);

  const handleClose = () => {
    onClose();
  };

  const handleDelete = (id) => {
    let formData = new FormData();
    formData.append("_id", id);
    axios
      .post(process.env.REACT_APP_HV_API + "/profile/delete", formData)
      .then(() => {
        axios.get(process.env.REACT_APP_HV_API + "/profile").then((res) => {
          if (res.data) {
            setData(res.data);
            console.log(res.data);
          }
        });
      });
  };

  useEffect(() => {
    if (props.open)
      axios.get(process.env.REACT_APP_HV_API + "/profile").then((res) => {
        if (res.data && res.data.length > 0) {
          setData(res.data);
        }
      });
  }, [props.open]);

  const columns = [
    { field: "id", headerName: "id", width: 70 },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => {
        return (
          <>
            <IconButton
              onClick={() => {
                handleDelete(params.value);
              }}
            >
              <DeleteIcon />
            </IconButton>
          </>
        );
      },
    },
    { field: "name", headerName: "Name", width: 200 },
    {
      field: "images",
      headerName: "Images",
      width: 500,
      renderCell: (params) => {
        let images = [];
        let count = 0;
        for (let image of params.value) {
          images.push(
            <img
              style={{
                marginRight: "1em",
                marginTop: "auto",
                marginBottom: "auto",
              }}
              height="140"
              src={`data:image;base64,${image.data}`}
              key={count}
            />
          );
          count++;
        }
        return <>{images.map((x) => x)}</>;
      },
    },
  ];

  const rows = [];
  let x = 0;
  for (let row of data) {
    const newRow = {
      id: x,
      actions: row._id,
      name: row.name,
      images: row.images,
    };
    rows.push(newRow);
    x++;
  }

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      scroll="paper"
      maxWidth="md"
      fullWidth
      aria-labelledby="manage-profiles-title"
    >
      <DialogTitle id="manage-profiles-title">Manage Profiles</DialogTitle>
      <DialogContent>
        {data.length > 0 ? (
          <div style={{ height: 500, width: "100%" }}>
            <DataGrid
              disableSelectionOnClick
              rows={rows}
              columns={columns}
              autoHeight
              rowHeight={150}
            />
          </div>
        ) : (
          <Typography variant="body1">No Profiles to Display</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Exit</Button>
      </DialogActions>
    </Dialog>
  );
};

const HVCreateProfile = () => {
  const [activeCreate, setActiveCreate] = useState(false);
  const [activeManage, setActiveManage] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRebuild = () => {
    setLoading(true);
    axios.post(process.env.REACT_APP_HV_API + "/rebuild").then((res) => {
      console.log(res);
      if (res.data && res.data.success) {
        setLoading(false);
      }
    });
  };

  const handleOpenCreate = () => {
    setActiveCreate(true);
  };

  const handleOpenManage = () => {
    setActiveManage(true);
  };

  const handleCloseCreate = () => {
    setActiveCreate(false);
  };

  const handleCloseManage = () => {
    setActiveManage(false);
  };

  return (
    <>
      <div style={{ padding: "2em" }}>
        <Typography variant="h5" style={{ marginBottom: "0.5em" }}>
          HelloVisitor Profiles
        </Typography>
        <Button
          disabled={loading}
          variant="contained"
          style={{ marginRight: "1em" }}
          color="secondary"
          onClick={handleOpenCreate}
        >
          Create Profile
        </Button>
        <Button
          disabled={loading}
          variant="contained"
          color="primary"
          style={{ marginRight: "1em" }}
          onClick={handleOpenManage}
        >
          Manage Profiles
        </Button>
        <Button disabled={loading} variant="contained" onClick={handleRebuild}>
          Rebuild Representations
        </Button>
        <CreateProfileDialog open={activeCreate} onClose={handleCloseCreate} />
        <ManageProfileDialog open={activeManage} onClose={handleCloseManage} />
      </div>
      {loading ? <LinearProgress /> : null}
    </>
  );
};

const HelloVisitor = (props) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs>
        <Card style={{ height: "492px" }}>
          <HVUpload />
        </Card>
      </Grid>
      <Grid item xs>
        <Card>
          <HVCreateProfile />
        </Card>
      </Grid>
    </Grid>
  );
};

export default HelloVisitor;

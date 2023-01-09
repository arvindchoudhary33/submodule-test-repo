import { h } from "preact";
import s from "./style.module.scss";
import Button from "@mui/material/Button";
import { useState, useEffect } from "preact/hooks";
import { useSnackbar } from "notistack";
import DialogTitle from "@mui/material/DialogTitle";
import Dialog from "@mui/material/Dialog";
import axiosClient from "../../components/axios-client";
const UserManagement = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [isUserAddDialogOpen, setUserAddDialogOpen] = useState(false);
  const [userData, setUserData] = useState([]);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    role: 0,
    user_id: "",
  });
  const userLevel = JSON.parse(localStorage.getItem("user_level")) === "4";
  const [validation, setValidation] = useState({
    passwordError: "",
    isPasswordValid: null,
  });
  /* TODO: fetch userRoles details through api call */
  const userRoles = [
    { id: 0, role: "Dev" },
    { id: 1, role: "Admin" },
    { id: 2, role: "SE" },
    { id: 3, role: "Manager" },
    { id: 4, role: "Basic" },
  ];
  const [isAddButton, setIsAddButton] = useState(true);

  useEffect(() => {
    getAllUsers();
  }, []);

  const getAllUsers = () => {
    axiosClient
      .get(`${process.env.FAST_API_IP_ADDRESS}/user/list/v1`)
      .then((res) => {
        console.log(res.data.length);
        setUserData(res.data);
        if (res.data.length == 0) {
          setDataAvailable(false);
        }
        setDataAvailable(true);
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      });
  };

  const handleUserEdit = (item) => {
    setFormData({
      name: item.name,
      password: item.password,
      role: item.role,
    });
    setValidation((prev) => ({
      ...prev,
      isPasswordValid: true,
    }));
    setIsAddButton(false);
    setUserAddDialogOpen(true);
  };
  const editUser = () => {
    axiosClient
      .put(
        `${process.env.FAST_API_IP_ADDRESS}/user/update/v1?user_name=${formData.name}`,
        formData
      )
      .then((res) => {
        if (res.status === 200) {
          enqueueSnackbar("updated successfully", { variant: "success" });
          getAllUsers();
        }
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      });
  };

  const handleUserDelete = (name) => {
    axiosClient
      .delete(
        `${process.env.FAST_API_IP_ADDRESS}/user/delete/v1?user_name=${name}`
      )
      .then((res) => {
        /* TODO: change to status code */
        if (res) {
          enqueueSnackbar("Successfully deleted", { variant: "success" });
          getAllUsers();
        }
      })
      .catch((error) => {
        enqueueSnackbar(error.message, { variant: "error" });
      });
  };

  const userCreate = () => {
    let form = new FormData();
    for (let key in formData) {
      form.append(key, formData[key]);
    }
    delete formData["user_id"];
    axiosClient
      .put(`${process.env.FAST_API_IP_ADDRESS}/user/create/v1/`, formData)
      .then((res) => {
        if (res.data.status === "failed") {
          enqueueSnackbar("user creation failed", { variant: "error" });
          return;
        }
        if (res.response?.status === 403) {
          enqueueSnackbar("Operation not permitted", { variant: "error" });
          setUserAddDialogOpen(false);
        } else {
          getAllUsers();
          setValidation((prev) => ({
            ...prev,
            isPasswordValid: null,
          }));
          setFormData({ name: "", password: "", role: 0, user_id: "" });
          setUserAddDialogOpen(false);
          enqueueSnackbar("Successfully added", { variant: "success" });
        }
      })
      .catch((error) => {
        setUserAddDialogOpen(false);
        enqueueSnackbar(error.message, { variant: "error" });
      });
  };

  const handleUserAdd = () => {
    if (isAddButton) {
      userCreate();
    } else {
      editUser();
      setUserAddDialogOpen(false);
      setFormData({ name: "", password: "", role: 0, user_id: "" });
      setIsAddButton(true);
    }
  };

  const handleRoleSelect = (e) => {
    setFormData((prev) => ({ ...prev, role: Number(e.target.value) }));
  };
  const handlePasswordCheckBox = (e) => {
    let ele = document.querySelector("#passwordInput");
    if (!e.target.checked) {
      /* setFormData((prev) => ({ ...prev, password: "" })); */
      delete formData.password;
      setValidation((prev) => ({
        ...prev,
        passwordError: "",
        isPasswordValid: true,
      }));
    } else {
      setValidation((prev) => ({
        ...prev,
        isPasswordValid: false,
      }));
    }
    ele.disabled = !e.target.checked;
  };
  return (
    <>
      <div class={s.userManagementMainContainer}>
        <div class={s.heading}>
          <span></span>
          <span> Manage users</span>
          <Button
            variant="contained"
            color="primary"
            disabled={
              JSON.parse(localStorage.getItem("user_level")) >= Number("3")
                ? true
                : false
            }
            onClick={() => {
              setUserAddDialogOpen(true);
            }}
          >
            ADD
          </Button>
        </div>
        <div class={s.userDataTable}>
          <p class={s.userDataTableHeading}>
            <span>S No.</span> <span>Name</span>
            <span>Role</span>
            <span class={s.actionsHeading}>Actions</span>
          </p>
          {!userData.length ? (
            <p class={s.loadingSpinner}>
              {!dataAvailable ? (
                <p>No available data</p>
              ) : (
                <i className="fa fa-spin fa-spinner" />
              )}
            </p>
          ) : (
            ""
          )}
          {userData?.map((item, index) => {
            return (
              <p class={s.userDataContainer} key={index}>
                <span>{index + 1}</span>
                <span class={s.name}> {item.name} </span>
                <span class={s.role}>
                  <b>{item.role_string} </b>
                </span>
                <span class={s.action}>
                  <Button
                    color="success"
                    onClick={() => {
                      handleUserEdit(item);
                    }}
                    disabled={userLevel}
                  >
                    <i className={`fa fa-edit ${s.editIcon}`} />
                  </Button>
                  <Button
                    color="error"
                    disabled={userLevel}
                    onClick={() => {
                      handleUserDelete(item.name);
                    }}
                  >
                    <i className={`fa fa-trash ${s.deleteIcon}`} />
                  </Button>
                </span>
              </p>
            );
          })}
        </div>
      </div>

      <Dialog open={isUserAddDialogOpen}>
        <DialogTitle>
          <div class={s.dialogHeading}>
            <span>{isAddButton ? "Add new user" : "Edit user"}</span>
            <i
              className="fa fa-remove"
              onClick={() => {
                setUserAddDialogOpen(false);
                setIsAddButton(true);
                setFormData({ name: "", password: "", role: 0 });
                setValidation((prev) => ({
                  ...prev,
                  passwordError: "",
                  isPasswordValid: true,
                }));
              }}
            />
          </div>
        </DialogTitle>
        <div class={s.userAddContainer}>
          <input
            type="text"
            value={formData.name}
            class="commonInput"
            disabled={isAddButton ? false : true}
            placeholder="user name"
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }));
            }}
          />
          <span></span>

          <input
            class="commonInput"
            placeholder="password"
            id="passwordInput"
            type="password"
            value={formData.password}
            disabled={!isAddButton}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, password: e.target.value }));
              if (e.target.value.length < 8) {
                setValidation((prev) => ({
                  ...prev,
                  passwordError: "password must be at least 8 characters long",
                  isPasswordValid: false,
                }));
              } else {
                setValidation((prev) => ({
                  ...prev,
                  passwordError: "",
                  isPasswordValid: true,
                }));
              }
            }}
          />

          <span class={s.errorMessage}>{validation.passwordError}</span>
          {userRoles ? (
            <select
              id="role_select"
              onChange={handleRoleSelect}
              class={s.userRoleSelect}
              value={formData.role}
            >
              {userRoles?.map((item) => {
                return (
                  <option key={item.id} value={item.id}>
                    {item.role}
                  </option>
                );
              })}
            </select>
          ) : (
            ""
          )}
          <Button
            variant="contained"
            color="primary"
            disabled={
              formData.name && validation.isPasswordValid ? false : true
            }
            onClick={handleUserAdd}
          >
            {isAddButton ? "ADD" : "UPDATE"}
          </Button>
          {!isAddButton ? (
            <div class={s.passwordChangeContainer}>
              <label for="passwordCheckBox" class={s.passwordCheckBoxLabel}>
                change password
              </label>
              <input
                type="checkbox"
                id="passwordCheckBox"
                onClick={handlePasswordCheckBox}
              />
            </div>
          ) : (
            ""
          )}
        </div>
      </Dialog>
    </>
  );
};

export default UserManagement;

import React, { useContext, useEffect, useState } from "react";
import GlobalContext from "../context/GlobalContext";
import UseAxiosPrivate from "../hooks/UseAxiosPrivate";
import { RiAddCircleLine } from "react-icons/ri";
import { MdDeleteOutline, MdOutlineEdit } from "react-icons/md";
import dayjs from "dayjs";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  role: "admin" | "user";
  createdAt: string;
  updatedAt: string;
}

const UserManagement = () => {
  const { setSelectedMenu } = useContext(GlobalContext);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const axiosPrivate = UseAxiosPrivate();

  useEffect(() => {
    setSelectedMenu("User Management");
    fetchUsers();
  }, [setSelectedMenu]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get("/api/auth/users");
      setUsers(response.data);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to fetch users";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axiosPrivate.delete(`/api/auth/users/${userId}`);
        setUsers(users.filter((user) => user._id !== userId));
      } catch (error: any) {
        console.error("Error deleting user:", error);
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data ||
          "Failed to delete user";
        alert(errorMessage);
      }
    }
  };

  const handleUpdateRole = async (
    userId: string,
    newRole: "admin" | "user"
  ) => {
    try {
      await axiosPrivate.put(`/api/auth/users/${userId}/role`, {
        role: newRole,
      });
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error: any) {
      console.error("Error updating user role:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to update user role";
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50">
        <div className="text-gray-600 text-lg animate-pulse">
          Loading users...
        </div>
      </div>
    );
  }

  // Show Add User Form
  if (showAddForm) {
    return (
      <AddUserForm
        onClose={() => setShowAddForm(false)}
        onUserAdded={(newUser) => {
          setUsers([...users, newUser]);
          setShowAddForm(false);
        }}
      />
    );
  }

  // Show Edit User Form
  if (editingUser) {
    return (
      <EditUserForm
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onUserUpdated={(updatedUser) => {
          setUsers(
            users.map((user) =>
              user._id === updatedUser._id ? updatedUser : user
            )
          );
          setEditingUser(null);
        }}
      />
    );
  }

  // Show User Management Table
  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">User Details</h2>
        <button
          className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 py-2 px-4 rounded-md text-white text-sm font-medium transition-colors duration-200 shadow-sm"
          onClick={() => setShowAddForm(true)}
        >
          <div className="text-lg">
            <RiAddCircleLine />
          </div>
          <div>Add User</div>
        </button>
      </div>
      <hr className="text-gray-300 w-full mb-8" />

      {/* Table to display users */}
      <table className="w-full divide-y divide-gray-200 rounded-lg overflow-hidden shadow-md">
        <thead className="text-gray-800 bg-white">
          <tr>
            {["name", "email", "address", "role", "created on", "action"].map(
              (heading) => (
                <th
                  key={heading}
                  className="py-4 text-center text-sm font-medium uppercase tracking-wider"
                >
                  {heading}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100">
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 text-center text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </td>

                <td className="py-3 text-center text-sm text-gray-900">
                  {user.email}
                </td>

                <td className="py-3 text-center text-sm text-gray-500">
                  {user.address}
                </td>

                <td className="py-3 text-center">
                  <select
                    value={user.role}
                    onChange={(e) =>
                      handleUpdateRole(
                        user._id,
                        e.target.value as "admin" | "user"
                      )
                    }
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border-0 ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>

                <td className="py-3 text-center text-sm text-gray-500">
                  {dayjs(user.createdAt).format("MMM D, YYYY h:mm A")}
                </td>

                <td className="py-3 text-sm font-medium">
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-blue-600 hover:bg-blue-600 hover:text-white rounded-full p-1"
                    >
                      <MdOutlineEdit className="text-lg" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:bg-red-600 hover:text-white rounded-full p-1"
                    >
                      <MdDeleteOutline className="text-lg" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-8 text-center text-sm text-gray-500"
              >
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// Add User Form Component
const AddUserForm = ({
  onClose,
  onUserAdded,
}: {
  onClose: () => void;
  onUserAdded: (user: User) => void;
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    address: "",
    role: "user" as "admin" | "user",
  });
  const [loading, setLoading] = useState(false);
  const axiosPrivate = UseAxiosPrivate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosPrivate.post(
        "/api/auth/create-user",
        formData
      );
      onUserAdded(response.data.user);
    } catch (error: any) {
      console.error("Error creating user:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to create user";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Add New User</h2>
        <button
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          ← Back to User Management
        </button>
      </div>
      <hr className="text-gray-300 w-full mb-8" />

      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "admin" | "user",
                })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Form Component
const EditUserForm = ({
  user,
  onClose,
  onUserUpdated,
}: {
  user: User;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    address: user.address,
    role: user.role,
  });
  const [loading, setLoading] = useState(false);
  const axiosPrivate = UseAxiosPrivate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axiosPrivate.put(
        `/api/auth/users/${user._id}`,
        formData
      );
      onUserUpdated({ ...user, ...formData });
    } catch (error: any) {
      console.error("Error updating user:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data ||
        "Failed to update user";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 overflow-x-auto px-5">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Edit User</h2>
        <button
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
          onClick={onClose}
        >
          ← Back to User Management
        </button>
      </div>
      <hr className="text-gray-300 w-full mb-8" />

      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-auto shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "admin" | "user",
                })
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagement;

export const getAllUsers = async () => {
    const response = await fetch('http://localhost:3000/users/all');
  
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
  
    const data = await response.json();
    return data.users;
  }

  export const deleteUser = async (userId) => {
    const response = await fetch(`http://localhost:3000/users/delete/${userId}`, {
      method: 'DELETE',
    });
  
    if (!response.ok) {
      throw new Error('Failed to delete user');
    }
  
    return response.json();
  }
  
  export const updateUser = async (userId, updatedData) => {
    const response = await fetch(`http://localhost:3000/users/update/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
  
    if (!response.ok) {
      throw new Error('Failed to update user');
    }
  
    return response.json();
  }
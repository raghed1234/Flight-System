import React, { useState, useEffect } from "react";

export default function Dashboard({ user }) {
  const [currentUser, setCurrentUser] = useState(user);

  useEffect(() => {
    if (!currentUser) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
    }
  }, [currentUser]);

  if (!currentUser) return <p>Loading...</p>; // optional

  return (
    <div>
      <h1>Welcome, {currentUser.name}!</h1>
      <p>This is your flight dashboard.</p>
    </div>
  );
}
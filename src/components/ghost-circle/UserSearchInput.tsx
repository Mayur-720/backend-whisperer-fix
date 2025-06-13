
import React, { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { searchUsers } from "@/lib/api";

interface User {
  _id: string;
  username: string;
  avatarEmoji: string;
  anonymousAlias: string;
}

interface UserSearchInputProps {
  onSelectUser: (username: string) => void;
}

const UserSearchInput: React.FC<UserSearchInputProps> = ({ onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchTerm.length < 1) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchUsers(searchTerm);
        console.log("Search results:", results);
        setUsers(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error searching users:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectUser = (username: string) => {
    onSelectUser(username);
    setSearchTerm(username);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder="Search users to invite..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm && setIsOpen(true)}
          autoComplete="off"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {loading && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
      </div>

      {isOpen && users.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          <ul className="py-1">
            {users.map((user) => (
              <li
                key={user._id}
                className="px-3 py-2 hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-gray-200"
                onClick={() => handleSelectUser(user.username)}
              >
                <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                  {user.avatarEmoji}
                </div>
                <div>
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.anonymousAlias}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isOpen && searchTerm && users.length === 0 && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg p-3 text-center text-gray-400">
          No users found
        </div>
      )}
    </div>
  );
};

export default UserSearchInput;

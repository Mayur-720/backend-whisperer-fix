
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { getRecognitions, revokeRecognition } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Recognition, User } from '@/types/user';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserCard from '@/components/user/UserCard';

const RecognitionsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('recognized');
  const [filter, setFilter] = useState('all');

  const { data, isLoading, refetch } = useQuery<Recognition>({
    queryKey: ['recognitions', activeTab, filter],
    queryFn: () => getRecognitions(activeTab, filter),
  });

  const handleRevokeRecognition = async (userId: string) => {
    if (!window.confirm('Are you sure you want to revoke this recognition? This cannot be undone.')) {
      return;
    }

    try {
      await revokeRecognition(userId);
      toast({
        title: 'Recognition revoked',
        description: 'The recognition has been successfully revoked.',
      });
      refetch();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to revoke recognition',
      });
    }
  };

  const renderUserList = (users: User[] = []) => {
    if (users.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No users found</p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {users.map((user) => (
          <UserCard key={user._id} user={user} onRecognitionSuccess={refetch} />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mr-2"
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-bold">Recognitions</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">{data?.stats.totalRecognized || 0}</p>
              <p className="text-sm text-muted-foreground">You Recognized</p>
            </div>
            <div className="border p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">{data?.stats.totalRecognizers || 0}</p>
              <p className="text-sm text-muted-foreground">Recognized You</p>
            </div>
            <div className="border p-4 rounded-lg text-center">
              <p className="text-2xl font-bold">{data?.stats.recognitionRate || 0}%</p>
              <p className="text-sm text-muted-foreground">Recognition Rate</p>
              <p className="text-xs text-muted-foreground mt-1">
                ({data?.stats.successfulRecognitions || 0}/{data?.stats.recognitionAttempts || 0})
              </p>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="mutual">Mutual Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="recognized" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="recognized">I've Recognized</TabsTrigger>
              <TabsTrigger value="recognizers">Recognized Me</TabsTrigger>
            </TabsList>
            <TabsContent value="recognized">
              {renderUserList(data?.recognized as User[])}
            </TabsContent>
            <TabsContent value="recognizers">
              {renderUserList(data?.recognizers as User[])}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default RecognitionsPage;

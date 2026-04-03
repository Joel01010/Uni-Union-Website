/**
 * Firebase Cloud Functions for VIT Chennai Student Utility
 * 
 * This file contains:
 * 1. Email domain restriction for new user signups
 * 2. User profile auto-creation on signup
 * 3. Cleanup functions for expired posts
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// ============================================
// 1. EMAIL DOMAIN RESTRICTION
// ============================================

/**
 * Blocks users who don't have a @vit.ac.in email.
 * This runs BEFORE the user is fully created.
 * 
 * Note: This is a Blocking Function (requires Firebase Authentication 
 * with Identity Platform upgrade)
 */
exports.beforeSignIn = functions.auth.user().beforeSignIn((user, context) => {
  const email = user.email || '';
  
  // Check if email ends with @vit.ac.in
  if (!email.endsWith('@vit.ac.in')) {
    throw new functions.auth.HttpsError(
      'permission-denied',
      'Access restricted to VIT Chennai students only. Please use your @vit.ac.in email.'
    );
  }
  
  // Allow the sign-in to proceed
  return;
});

/**
 * Alternative: If you don't want to use Blocking Functions,
 * you can use this onCreate trigger to delete non-VIT users immediately.
 * (Less secure but works on standard Firebase Auth)
 */
exports.validateNewUser = functions.auth.user().onCreate(async (user) => {
  const email = user.email || '';
  
  if (!email.endsWith('@vit.ac.in')) {
    console.log(`Deleting unauthorized user: ${user.uid} (${email})`);
    
    try {
      await admin.auth().deleteUser(user.uid);
      console.log(`Successfully deleted user: ${user.uid}`);
    } catch (error) {
      console.error(`Error deleting user ${user.uid}:`, error);
    }
    
    return null;
  }
  
  // User is valid - continue with profile creation
  return null;
});

// ============================================
// 2. AUTO-CREATE USER PROFILE
// ============================================

/**
 * Creates a user profile document in Firestore when a new user signs up.
 */
exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  const email = user.email || '';
  
  // Skip if not a VIT student (they'll be deleted by validateNewUser)
  if (!email.endsWith('@vit.ac.in')) {
    return null;
  }
  
  const userProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || email.split('@')[0],
    photoUrl: user.photoURL || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  
  try {
    await db.collection('users').doc(user.uid).set(userProfile);
    console.log(`Created profile for user: ${user.uid}`);
  } catch (error) {
    console.error(`Error creating profile for ${user.uid}:`, error);
  }
  
  return null;
});

// ============================================
// 3. CLEANUP EXPIRED POSTS
// ============================================

/**
 * Scheduled function to clean up expired empty class posts.
 * Runs every hour.
 */
exports.cleanupExpiredClassPosts = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    try {
      const expiredPosts = await db
        .collection('empty_class_posts')
        .where('expiresAt', '<', now)
        .get();
      
      if (expiredPosts.empty) {
        console.log('No expired posts to clean up');
        return null;
      }
      
      const batch = db.batch();
      expiredPosts.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Deleted ${expiredPosts.size} expired class posts`);
      
    } catch (error) {
      console.error('Error cleaning up expired posts:', error);
    }
    
    return null;
  });

// ============================================
// 4. SEND NOTIFICATION ON NEW MESSAGE
// ============================================

/**
 * Sends a push notification when a new message is sent in a chat.
 * Requires Firebase Cloud Messaging setup.
 */
exports.onNewMessage = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const { chatId } = context.params;
    
    try {
      // Get the chat room to find participants
      const chatDoc = await db.collection('chats').doc(chatId).get();
      if (!chatDoc.exists) return null;
      
      const chatData = chatDoc.data();
      const recipientId = chatData.participants.find(id => id !== message.senderId);
      
      if (!recipientId) return null;
      
      // Get recipient's FCM token (would need to be stored in user profile)
      const recipientDoc = await db.collection('users').doc(recipientId).get();
      if (!recipientDoc.exists) return null;
      
      const fcmToken = recipientDoc.data().fcmToken;
      if (!fcmToken) return null;
      
      // Send the notification
      const notification = {
        token: fcmToken,
        notification: {
          title: chatData.listingTitle || 'New Message',
          body: message.text.substring(0, 100),
        },
        data: {
          chatId: chatId,
          type: 'new_message',
        },
      };
      
      await admin.messaging().send(notification);
      console.log(`Notification sent to ${recipientId}`);
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
    
    return null;
  });
